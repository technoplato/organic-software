#!/usr/bin/env node

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import net from "node:net";
import { init, tx, id } from "@instantdb/node";
import { execSync } from "node:child_process";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const APP_ID =
  process.env.INSTANTDB_APP_ID ||
  process.env.EXPO_PUBLIC_INSTANTDB_APP_ID ||
  "";
console.log("🔑 Supervisor APP_ID:", APP_ID ? "configured" : "missing");
const CHECK_MS = 10_000;
const STALE_MS = 30_000;
const ZSCALER_SCRIPT_DIR = "/Users/mlustig/dev/tools/zscaler-auto-disabler";
const ZSCALER_DISABLE_ONCE_SCRIPT =
  "/Users/mlustig/dev/tools/zscaler-auto-disabler/disable_once.py";

type ProcSpec = {
  name: string;
  cmd: string;
  args: string[];
  cwd?: string;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
};

function backoffGen() {
  let ms = 1000;
  return () => {
    const v = ms;
    ms = Math.min(ms * 2, 30000);
    return v;
  };
}

class Supervisor {
  private handler?: ChildProcess;
  private bundler?: ChildProcess;
  private handlerBackoff = backoffGen();
  private bundlerBackoff = backoffGen();
  private interval?: NodeJS.Timeout;
  private bundleCheckInterval?: NodeJS.Timeout;
  private db = APP_ID ? init({ appId: APP_ID }) : null;
  private handlerExitTimes: number[] = [];
  private crashWindowMs = 60_000;
  private crashThreshold = 3;
  private enableGit = process.env.SUPERVISOR_ENABLE_GIT === "1";
  private gitRecovery: "stash" | "reset" =
    (process.env.SUPERVISOR_GIT_RECOVERY as any) || "stash";
  private lastExpoErrorSig: string | null = null;
  private lastExpoErrorAt = 0;
  private expoPort: number | null = null;
  private zscalerCheckAttempts = 0;
  private maxZscalerAttempts = 3;
  private startupTime = Date.now();

  start() {
    console.log("👷 Starting supervisor");
    this.startHandler();
    this.startBundler();
    // Give the handler 20 seconds to write its first heartbeat before checking
    this.interval = setInterval(() => this.checkHealth(), CHECK_MS) as any;
    // Check for bundle errors every 10 seconds
    this.bundleCheckInterval = setInterval(
      () => this.checkBundleForErrors(),
      10000,
    ) as any;
    process.on("SIGINT", () => this.stop());
  }

  stop() {
    console.log("\n🛑 Stopping supervisor");
    if (this.interval) clearInterval(this.interval);
    if (this.bundleCheckInterval) clearInterval(this.bundleCheckInterval);
    this.kill("handler");
    this.kill("bundler");
    process.exit(0);
  }

  private spawnProc(spec: ProcSpec) {
    const wantPipes = Boolean(spec.onStdout || spec.onStderr);
    const p = spawn(spec.cmd, spec.args, {
      cwd: spec.cwd,
      stdio: wantPipes ? "pipe" : "inherit",
      env: process.env,
    });
    if (wantPipes) {
      if (p.stdout)
        p.stdout.on("data", (d) => {
          const s = d.toString();
          process.stdout.write(s);
          spec.onStdout?.(s);
        });
      if (p.stderr)
        p.stderr.on("data", (d) => {
          const s = d.toString();
          process.stderr.write(s);
          spec.onStderr?.(s);
        });
    }
    p.on("exit", (code, signal) => {
      console.log(`⚠️ ${spec.name} exited (code=${code}, signal=${signal})`);
      if (spec.name === "handler") this.onHandlerExit();
      if (spec.name === "bundler") this.restartBundler();
    });
    return p;
  }

  private onHandlerExit() {
    this.handlerExitTimes.push(Date.now());
    const cutoff = Date.now() - this.crashWindowMs;
    this.handlerExitTimes = this.handlerExitTimes.filter((t) => t >= cutoff);
    if (this.handlerExitTimes.length >= this.crashThreshold) {
      console.log("🧯 Repeated handler crashes detected. Initiating recovery.");
      this.recoverFromCrashes();
      this.handlerExitTimes = [];
    }
    this.restartHandler();
  }

  private startHandler() {
    if (this.handler) return;
    console.log("▶️  Starting handler");
    // Reset startup time when starting handler to give it grace period
    this.startupTime = Date.now();
    // Use nodemon so the handler restarts automatically on file changes
    // Only watch the handler file itself and key config files, not the entire directory
    this.handler = this.spawnProc({
      name: "handler",
      cmd: "npx",
      args: [
        "nodemon",
        "--quiet",
        "--watch",
        "instant-message-handler-ai.ts",
        "--watch",
        ".env",
        "--watch",
        "package.json",
        "--ignore",
        "mobile-app/",
        "--ignore",
        "tests/",
        "--ignore",
        "docs/",
        "--ignore",
        "*.log",
        "--ignore",
        "*.md",
        "--ext",
        "ts,tsx,js,json",
        "--signal",
        "SIGINT",
        "--exec",
        "npx tsx instant-message-handler-ai.ts",
      ],
    });
  }

  private restartHandler() {
    this.handler = undefined;
    const wait = this.handlerBackoff();
    console.log(`⏳ Restarting handler in ${wait}ms`);
    setTimeout(() => this.startHandler(), wait);
  }

  private async startBundler(detached = false) {
    if (this.bundler) return;
    console.log("▶️  Starting Expo bundler");
    // Choose a port to avoid interactive prompt
    const preferred = Number(process.env.EXPO_PORT) || 8081;
    const alt = Number(process.env.EXPO_ALT_PORT) || 8082;
    const port = await findFreePort([preferred, alt]);
    this.expoPort = port;
    const extraArgs: string[] = ["--port", String(port)];
    // Optionally open iOS simulator
    if (
      process.platform === "darwin" &&
      process.env.SUPERVISOR_OPEN_SIM === "1"
    ) {
      extraArgs.push("--ios");
    }
    if (detached) {
      const p = spawn("npx", ["expo", "start"], {
        cwd: "mobile-app",
        stdio: "ignore",
        env: process.env,
        detached: true,
      });
      // Let it run independently
      p.unref();
      this.bundler = undefined; // not tracked in detached mode
      return;
    }
    this.bundler = this.spawnProc({
      name: "bundler",
      cmd: "npx",
      args: ["expo", "start", ...extraArgs],
      cwd: "mobile-app",
      onStdout: (s) => this.scanExpoLog(s),
      onStderr: (s) => this.scanExpoLog(s),
    });
  }

  private restartBundler() {
    this.bundler = undefined;
    const wait = this.bundlerBackoff();
    console.log(`⏳ Restarting bundler in ${wait}ms`);
    setTimeout(() => this.startBundler(), wait);
  }

  private async checkHealth() {
    if (!this.db) return;

    // Skip health checks for the first 20 seconds to give handler time to start
    const timeSinceStartup = Date.now() - this.startupTime;
    if (timeSinceStartup < 20000) {
      return;
    }

    try {
      const res = await withTimeout(
        this.db.queryOnce({ heartbeats: {} }),
        1500,
        "heartbeats query",
      );
      const beats = res.data?.heartbeats || [];
      const now = Date.now();
      const hostBeat = beats.find((h: any) => h.kind === "host");
      if (!hostBeat || now - (hostBeat.lastSeenAt || 0) > STALE_MS) {
        console.log("🔴 Host heartbeat stale → restarting handler");
        this.kill("handler");
        this.restartHandler();
        await this.logToDb(
          "health",
          "Host heartbeat stale, handler restarted",
          { lastSeenAt: hostBeat?.lastSeenAt },
        );
      }
    } catch (err) {
      console.warn("⚠️ Health check failed", err);
    }
  }

  private kill(which: "handler" | "bundler") {
    const p = which === "handler" ? this.handler : this.bundler;
    if (p) {
      try {
        p.kill("SIGINT");
      } catch {}
    }
    if (which === "handler") this.handler = undefined;
    if (which === "bundler") this.bundler = undefined;
  }

  private async logToDb(kind: string, message: string, meta?: any) {
    if (!this.db) return;
    try {
      const logId = id();
      await withTimeout(
        (this.db as any).transact([
          (tx as any).logs[logId].update({
            id: logId,
            kind,
            message,
            meta: meta || {},
            timestamp: Date.now(),
          }),
        ]),
        2000,
        "logToDb transact",
      );
    } catch {}
  }

  private isZscalerActive(): boolean {
    try {
      // Check if Zscaler routes are present in routing table
      const result = execSync(
        'netstat -rn | grep -E "165\\.225\\.|104\\.129\\."',
        { encoding: "utf8" },
      );
      return result.length > 0;
    } catch {
      // grep returns non-zero if no match found
      return false;
    }
  }

  private disableZscaler(): boolean {
    try {
      console.log("🔐 Attempting to disable Zscaler Internet Security...");

      // Use the one-shot disable script
      const result = execSync(`python3 "${ZSCALER_DISABLE_ONCE_SCRIPT}"`, {
        encoding: "utf8",
        timeout: 35000, // 35 seconds timeout
        stdio: ["pipe", "pipe", "pipe"],
      });

      console.log(result.trim());

      // Check if the script succeeded
      if (result.includes("Success:") || result.includes("already OFF")) {
        console.log("✅ Zscaler disabled successfully");
        return true;
      }

      return false;
    } catch (error: any) {
      // Check if it's just because Zscaler was already off
      if (error.stdout && error.stdout.includes("already OFF")) {
        console.log("✅ Zscaler was already disabled");
        return true;
      }
      console.error("❌ Failed to disable Zscaler:", error.message);
      return false;
    }
  }

  private handleZscalerError(): void {
    if (this.zscalerCheckAttempts >= this.maxZscalerAttempts) {
      console.log(
        "⚠️ Max Zscaler disable attempts reached. Please manually disable Zscaler.",
      );
      return;
    }

    this.zscalerCheckAttempts++;

    if (this.isZscalerActive()) {
      console.log(
        "🔍 Zscaler detected as active (attempt " +
          this.zscalerCheckAttempts +
          "/" +
          this.maxZscalerAttempts +
          ")",
      );

      if (this.disableZscaler()) {
        // Wait a bit for network to stabilize after disabling Zscaler
        console.log("⏳ Waiting 3 seconds for network to stabilize...");
        setTimeout(() => {
          this.zscalerCheckAttempts = 0; // Reset counter on success
          this.restartBundler();
        }, 3000);
      } else {
        // Try again after a delay
        setTimeout(() => this.handleZscalerError(), 5000);
      }
    } else {
      console.log(
        "ℹ️ Zscaler appears to be inactive, but fetch is still failing",
      );
      // Reset counter since Zscaler isn't the issue
      this.zscalerCheckAttempts = 0;
    }
  }

  private scanExpoLog(chunk: string) {
    try {
      const line = chunk.toString();

      // Check for fetch/network errors that might be Zscaler-related
      if (
        line.includes("TypeError: fetch failed") ||
        line.includes("UNDICI") ||
        line.includes("ECONNREFUSED") ||
        line.includes("ETIMEDOUT")
      ) {
        console.log("🌐 Network error detected in Expo bundler");
        this.handleZscalerError();
        return;
      }

      // Check for other Expo errors - capture the full error
      const hit = EXPO_ERROR_PATTERNS.find((re) => re.test(line));
      if (!hit) return;

      // For syntax errors, try to capture the full error with context
      const fullError = chunk.toString(); // Keep full chunk for context
      const now = Date.now();

      // De-duplicate same error within 15s window
      const sig = line.trim().slice(0, 200);
      if (this.lastExpoErrorSig === sig && now - this.lastExpoErrorAt < 15_000)
        return;

      this.lastExpoErrorSig = sig;
      this.lastExpoErrorAt = now;
      console.log("🧨 Detected Expo error:", line.slice(0, 100));

      // Determine error type from the pattern
      let errorType = "unknown";
      if (/SyntaxError/i.test(line)) errorType = "SyntaxError";
      else if (/TransformError/i.test(line)) errorType = "TransformError";
      else if (/Module.*not found/i.test(line)) errorType = "ModuleNotFound";
      else if (/Failed building/i.test(line)) errorType = "BuildError";

      // Dispatch error to errors table for Claude to handle
      this.dispatchErrorToClaude(fullError, errorType);
    } catch {
      // ignore
    }
  }

  private async dispatchErrorToClaude(errorContent: string, errorType: string) {
    if (!this.db) return;

    try {
      const errorId = id();
      const errorData = {
        id: errorId,
        type: "expo-bundler",
        errorType: errorType,
        content: errorContent,
        source: "supervisor",
        timestamp: Date.now(),
        status: "pending",
        metadata: {
          port: this.expoPort,
          cwd: "mobile-app",
        },
      };

      console.log("📤 Dispatching error to errors table:", errorType);

      await withTimeout(
        (this.db as any).transact([
          (tx as any).errors[errorId].update(errorData),
        ]),
        2000,
        "dispatchError transact",
      );
    } catch (err) {
      console.error("❌ Failed to dispatch error:", err);
    }
  }

  async installMobileDeps() {
    console.log("📦 Installing mobile dependencies (will restart bundler)");
    this.kill("bundler");
    const res = spawnSync("npm", ["install"], {
      cwd: "mobile-app",
      stdio: "inherit",
      env: process.env,
    });
    if (res.status !== 0) {
      console.error("❌ npm install failed");
      await this.logToDb("deps", "npm install failed for mobile-app", {
        status: res.status,
      });
      // Exit with error code
      process.exit(1);
    }
    await this.logToDb("deps", "npm install completed for mobile-app");
    console.log("✅ Dependencies installed successfully");
    // If running in one-off mode, detach bundler so this command exits
    const detached = process.env.SUPERVISOR_DETACH_BUNDLER === "1";
    if (detached) {
      console.log("🚀 Starting bundler in detached mode...");
      await this.startBundler(true);
    } else {
      console.log("🚀 Restarting bundler...");
      this.restartBundler();
    }
    // Exit after completing the task
    process.exit(0);
  }

  private async checkBundleForErrors() {
    if (!this.expoPort || !this.bundler) return;

    try {
      // Fetch the iOS bundle to check for errors
      const response = await fetch(
        `http://localhost:${this.expoPort}/index.ts.bundle?platform=ios&dev=true`,
      );
      const text = await response.text();

      // Check if response contains an error
      if (
        text.includes('"type":"TransformError"') ||
        text.includes('"name":"SyntaxError"')
      ) {
        try {
          const errorData = JSON.parse(text);
          if (
            errorData.type === "TransformError" ||
            errorData.name === "SyntaxError"
          ) {
            const errorContent = errorData.message || text;
            const errorType = errorData.name || "TransformError";

            // Check for deduplication
            const now = Date.now();
            const sig = errorContent.slice(0, 200);
            if (
              this.lastExpoErrorSig === sig &&
              now - this.lastExpoErrorAt < 15_000
            )
              return;

            this.lastExpoErrorSig = sig;
            this.lastExpoErrorAt = now;

            console.log("🧨 Detected Expo bundle error:", errorType);
            console.log(
              "📍 Error location:",
              errorData.filename,
              "line",
              errorData.lineNumber,
            );

            // Dispatch to Claude
            this.dispatchErrorToClaude(errorContent, errorType);
          }
        } catch (parseErr) {
          // If we can't parse it, still log that we found an error
          console.log("🧨 Detected Expo bundle error (unparseable)");
        }
      }
    } catch (err) {
      // Ignore fetch errors - bundler might not be ready yet
    }
  }

  private recoverFromCrashes() {
    if (!this.enableGit) {
      console.log("ℹ️ Git recovery disabled (SUPERVISOR_ENABLE_GIT!=1)");
      return;
    }
    console.log(`🔧 Running git recovery strategy: ${this.gitRecovery}`);
    try {
      spawnSync("git", ["status", "--porcelain"], { stdio: "inherit" });
    } catch {}
    try {
      if (this.gitRecovery === "stash")
        spawnSync("git", ["stash", "-u"], { stdio: "inherit" });
      else if (this.gitRecovery === "reset")
        spawnSync("git", ["reset", "--hard", "HEAD"], { stdio: "inherit" });
    } catch (e) {
      console.warn("⚠️ Git recovery failed", e);
    }
  }
}

// Basic per-call timeout to avoid indefinite hangs on InstantDB calls
function withTimeout<T>(p: Promise<T>, ms: number, label = "op"): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout ${ms}ms: ${label}`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// Expo error patterns to detect build/syntax issues
const EXPO_ERROR_PATTERNS = [
  /SyntaxError/i,
  /TransformError/i,
  /Failed building JavaScript bundle/i,
  /Error: .*from Metro/i,
  /Module build failed/i,
  /Cannot find module/i,
  /Module not found/i,
];

function main() {
  // Optional self-watch (use SUPERVISOR_WATCH_SELF=1): re-run supervisor via nodemon when this file changes
  if (
    process.env.SUPERVISOR_WATCH_SELF === "1" &&
    process.env.SUPERVISOR_WRAPPED !== "1"
  ) {
    const env = {
      ...process.env,
      SUPERVISOR_WRAPPED: "1",
    } as NodeJS.ProcessEnv;
    const p = spawn(
      "npx",
      [
        "nodemon",
        "--quiet",
        "--watch",
        "supervisor.ts",
        "--ext",
        "ts,js,json",
        "--signal",
        "SIGINT",
        "--exec",
        "npx tsx supervisor.ts",
      ],
      { stdio: "inherit", env },
    );
    p.on("exit", (code) => process.exit(code ?? 0));
    return;
  }
  const cmd = process.argv[2] || "start";
  if (cmd === "status") {
    console.log("Use heartbeats in app to view status");
    return;
  }
  const sup = new Supervisor();
  if (cmd === "start") sup.start();
  else if (cmd === "restart-bundler") {
    (sup as any)["kill"]("bundler");
    (sup as any)["restartBundler"]();
  } else if (cmd === "reload-bundler") {
    // Send 'r' to Expo bundler to trigger reload
    const send = () => {
      const p = (sup as any)["bundler"] as ChildProcess | undefined;
      if (p && p.stdin && !p.killed) {
        try {
          p.stdin.write("r");
          console.log("🔁 Sent reload to Expo bundler");
        } catch {}
      } else {
        console.log("ℹ️ Bundler not running");
      }
    };
    send();
  } else if (cmd === "restart-handler") {
    (sup as any)["kill"]("handler");
    (sup as any)["restartHandler"]();
  } else if (cmd === "deps-mobile") (sup as any).installMobileDeps();
  else console.log("Unknown command");
}

main();

// Find a free TCP port, trying preferred list first
function findFreePort(preferred: number[]): Promise<number> {
  return new Promise((resolve) => {
    const tryList = [...preferred];
    const tryNext = () => {
      const want = tryList.shift();
      if (want == null) {
        // fallback to random
        const srv = net.createServer();
        srv.listen(0, () => {
          const p = (srv.address() as any).port as number;
          srv.close(() => resolve(p));
        });
        srv.on("error", () => resolve(8081));
        return;
      }
      const srv = net.createServer();
      srv.once("error", () => {
        try {
          srv.close();
        } catch {}
        tryNext();
      });
      srv.listen(want, () => {
        srv.close(() => resolve(want));
      });
    };
    tryNext();
  });
}
