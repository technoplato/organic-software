# File Organization Rules

This document defines the standard file organization structure for the Organic Software project. Following these rules ensures consistency and makes the codebase easier to navigate and maintain.

## Directory Structure

```
/
├── config/                  # Configuration files
│   ├── mcp-config.json
│   └── openai_proxy_api_key.json
│
├── docs/                    # All documentation
│   ├── ai-sdk/              # AI SDK documentation
│   ├── expo/                # Expo documentation
│   ├── architecture.md      # System architecture documentation
│   ├── project.md           # Project overview
│   └── ...                  # Other documentation files
│
├── mobile-app/              # Mobile application
│   ├── app/                 # App screens and components
│   ├── assets/              # Images, fonts, etc.
│   ├── lib/                 # Mobile-specific libraries
│   └── ...
│
├── scripts/                 # Utility scripts
│   ├── setup/               # Setup scripts
│   ├── debug/               # Debugging scripts
│   └── deployment/          # Deployment scripts
│
├── server/                  # Backend server code
│   ├── lib/                 # Server-specific libraries
│   ├── handlers/            # Message and event handlers
│   └── services/            # Backend services
│
├── tests/                   # All tests
│   ├── e2e/                 # End-to-end tests
│   ├── integration/         # Integration tests
│   ├── unit/                # Unit tests
│   └── fixtures/            # Test fixtures/data
│
├── lib/                     # Shared libraries used by both server and mobile
│
├── package.json             # Project dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project overview
```

## File Placement Rules

1. **Configuration Files**
   - All configuration files should be placed in the `config/` directory
   - Environment-specific configurations should use appropriate naming: `config.dev.json`, `config.prod.json`

2. **Documentation**
   - All documentation files should be in the `docs/` directory
   - Use subdirectories to organize documentation by topic
   - Use Markdown (`.md`) for all documentation

3. **Tests**
   - All test files should be in the `tests/` directory
   - Tests should be organized by type: unit, integration, e2e
   - Test files should be named with the pattern: `test-[what-is-being-tested].ts`
   - Test fixtures should be in `tests/fixtures/`
   - **Test Documentation**: Each test file must begin with a comprehensive comment block that includes:
     - **How to Run**: The exact command to execute this test (npm script, npx command, etc.)
     - **Purpose**: Why the test exists and what it validates
     - **Test Coverage**: Exactly what functionality/behavior is being tested
     - **Test Data**: What data was added or used for testing
     - **Problem Context**: What challenges or issues this test helps resolve
     - **User Request**: What the user originally asked the LLM to create a test for
     - Example format:
       ```typescript
       /**
        * Test: [Test Name]
        * How to Run: npm run test:unit -- test-structured-output.ts
        *            OR: npx tsx tests/unit/test-structured-output.ts
        * Purpose: [Why this test exists]
        * Tests: [What exactly is being tested]
        * Test Data: [What data was added/used]
        * Challenges: [What problems this test addresses]
        * User Request: [Original user request to LLM]
        */
       ```

4. **Scripts**
   - All utility scripts should be in the `scripts/` directory
   - Scripts should be organized by purpose in subdirectories
   - Shell scripts should use `.sh` extension
   - TypeScript scripts should use `.ts` extension

5. **Server Code**
   - All backend code should be in the `server/` directory
   - Message handlers should be in `server/handlers/`
   - Backend services should be in `server/services/`
   - Server-specific libraries should be in `server/lib/`

6. **Mobile App Code**
   - All mobile app code should be in the `mobile-app/` directory
   - Follow Expo/React Native conventions within this directory

7. **Shared Libraries**
   - Code shared between server and mobile should be in the root `lib/` directory

## Naming Conventions

1. **Files**
   - Use kebab-case for file names: `file-name.ts`
   - Use descriptive names that indicate the file's purpose
   - TypeScript files should use `.ts` extension
   - React components should use `.tsx` extension

2. **Directories**
   - Use kebab-case for directory names: `directory-name/`
   - Use descriptive names that indicate the directory's purpose

## Exceptions

Any exceptions to these rules must be documented in the README.md file with a clear explanation of why the exception is necessary.