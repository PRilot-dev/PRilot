import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
		globals: true,
		globalSetup: ["./src/tests/globalSetup.ts"],
		setupFiles: ["./src/tests/setup.ts"],
		clearMocks: true,
		// Run test files sequentially so they don't race on the shared test database.
		fileParallelism: false,
		alias: {
			// Stub out Next.js server-only guard — it throws outside the Next runtime
			"server-only": path.resolve(
				__dirname,
				"./src/tests/__mocks__/server-only.ts",
			),
		},
		coverage: {
			provider: "v8",
			include: ["src/app/api/**/*.ts"],
			exclude: ["src/tests/**"],
		},
	},
});
