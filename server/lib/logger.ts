import callsites from "callsites";
import fs from "fs";
import path from "path";

// Cache for the project root to avoid repeated filesystem operations
let projectRootCache: string | null = null;

/**
 * Finds the project root by traversing up the directory tree
 * until finding a directory with a package.json file
 */
function findProjectRoot(startPath: string): string | null {
  try {
    // Handle file:// URLs by converting them to regular paths
    let normalizedPath = startPath;
    if (normalizedPath.startsWith("file://")) {
      normalizedPath = new URL(normalizedPath).pathname;
    }

    // Convert to directory if it's a file
    let currentDir = fs.statSync(normalizedPath).isDirectory()
      ? normalizedPath
      : path.dirname(normalizedPath);

    // Normalize the path
    currentDir = path.resolve(currentDir);

    // Traverse up until we find package.json or hit the root
    while (true) {
      // Check if package.json exists in this directory
      if (fs.existsSync(path.join(currentDir, "package.json"))) {
        return currentDir;
      }

      // Go up one directory
      const parentDir = path.dirname(currentDir);

      // If we've reached the root directory and still haven't found package.json
      if (parentDir === currentDir) {
        return null;
      }

      currentDir = parentDir;
    }
  } catch (error) {
    console.error("Error finding project root:", error);
    return null;
  }
}

/**
 * Gets the relative path from the project root
 */
function getRelativePath(filePath: string | undefined | null): string {
  if (!filePath) return "unknown";

  // Handle file:// URLs by converting them to regular paths
  let normalizedPath = filePath;
  if (normalizedPath.startsWith("file://")) {
    normalizedPath = new URL(normalizedPath).pathname;
  }

  // Find and cache the project root
  if (!projectRootCache) {
    projectRootCache = findProjectRoot(normalizedPath);
  }

  // If we found the project root, return the relative path
  if (projectRootCache) {
    return path.relative(projectRootCache, normalizedPath);
  }

  // Fallback to the full path if we couldn't find the project root
  return normalizedPath;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerConfig {
  level: LogLevel;
  enabled: boolean;
}

const defaultConfig: LoggerConfig = {
  level: "info",
  enabled: true,
};

const levelOrder: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let config: LoggerConfig = { ...defaultConfig };

export function configureLogger(newConfig: Partial<LoggerConfig>) {
  config = { ...config, ...newConfig };
}

function getCallsiteInfo() {
  const sites = callsites();

  // Debug: Print ALL available information from each callsite in JSON format
  console.log("\n=== CALLSITES DEBUG INFO ===");
  sites.forEach((site, index) => {
    const siteInfo = {
      index,
      fileName: site.getFileName(),
      lineNumber: site.getLineNumber(),
      columnNumber: site.getColumnNumber(),
      functionName: site.getFunctionName(),
      methodName: site.getMethodName(),
      typeName: site.getTypeName(),
      evalOrigin: site.getEvalOrigin(),
      isConstructor: site.isConstructor(),
      isEval: site.isEval(),
      isNative: site.isNative(),
      isToplevel: site.isToplevel(),
      // Try to get the 'this' value (might be undefined)
      thisValue:
        typeof site.getThis === "function" ? String(site.getThis()) : undefined,
      // Get the function if available
      function:
        typeof site.getFunction === "function"
          ? String(site.getFunction()).substring(0, 100)
          : undefined,
    };
    // console.log(JSON.stringify(siteInfo, null, 2));
  });
  // console.log('=== END CALLSITES DEBUG ===\n');

  // Find the first callsite that's not from the logger module
  let userCallsite = null;
  for (const site of sites) {
    const fileName = site.getFileName();
    if (!fileName) continue;

    const relativePath = getRelativePath(fileName);
    // Skip callsites from the logger module
    if (!relativePath.includes("server/lib/logger.ts")) {
      userCallsite = site;
      break;
    }
  }

  if (!userCallsite) {
    // Fallback to a default depth if we couldn't find a non-logger callsite
    userCallsite = sites[3] || sites[sites.length - 1];
  }

  if (!userCallsite) return "";

  const file = getRelativePath(userCallsite.getFileName());
  const line = userCallsite.getLineNumber();
  const func = userCallsite.getFunctionName();

  return `${file}#${line}#${func}`;
}

function shouldLog(level: LogLevel) {
  return config.enabled && levelOrder[level] >= levelOrder[config.level];
}

function log(level: LogLevel, ...args: any[]) {
  if (!shouldLog(level)) return;
  const prefix = `[${level.toUpperCase()}] ${getCallsiteInfo()}`;
  // eslint-disable-next-line no-console
  console.log(prefix, ...args);
}

export const logger = {
  debug: (...args: any[]) => log("debug", ...args),
  info: (...args: any[]) => log("info", ...args),
  warn: (...args: any[]) => log("warn", ...args),
  error: (...args: any[]) => log("error", ...args),
  configure: configureLogger,
};
