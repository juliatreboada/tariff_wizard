import { defineConfig } from "vitest/config";

// Node 25+ ships its own localStorage global, which hides jsdom's. The flag
// that turns it off doesn't exist on older Node (e.g. 20), where passing it
// would crash the test workers — so only pass it when Node knows it.
const webstorageFlag = "--no-experimental-webstorage";
const execArgv = process.allowedNodeEnvironmentFlags.has(webstorageFlag)
  ? [webstorageFlag]
  : [];

export default defineConfig({
  resolve: {
    // Resolve the `@/` alias from tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    // jsdom provides localStorage for the persisted Zustand store.
    environment: "jsdom",
    execArgv,
    include: ["lib/**/*.test.ts"],
  },
});
