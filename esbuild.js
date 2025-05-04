const { build, context } = require("esbuild");

const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production",
};

const extensionConfig = {
  ...baseConfig,
  platform: "node",
  mainFields: ["module", "main"],
  format: "cjs",
  entryPoints: ["./src/extension.js"],
  outfile: "./out/extension.js",
  external: ["vscode"],
};

(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes("--watch")) {
      // Build and watch source code
      console.log("[watch] build started");

      const extensionCtx = await context(extensionConfig);

      await Promise.all([
        extensionCtx.watch(),
      ]);

      console.log("[watch] watching...");
    } else {
      // Build source code
      await build(extensionConfig);
      console.log("build complete");
    }
  } catch (err) {
    process.stderr.write(err?.stderr || String(err));
    process.exit(1);
  }
})();
