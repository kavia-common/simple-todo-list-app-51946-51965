import { defineConfig } from "vitest/config";

// PUBLIC_INTERFACE
export default defineConfig({
  /** Vitest configuration for CI-style test runs. */
  test: {
    environment: "jsdom",
  },
});
