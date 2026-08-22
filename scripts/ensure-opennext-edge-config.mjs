import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { build } from "esbuild";

// OpenNext 1.20.x can lose the compiled edge config while copying its temporary
// build directory on Windows. The middleware bundler immediately needs this file.
if (process.platform === "win32") {
  const projectDir = process.cwd();
  const openNextBuildDir = path.join(projectDir, ".open-next", ".build");
  const source = path.join(projectDir, "open-next.config.ts");
  const output = path.join(openNextBuildDir, "open-next.config.edge.mjs");

  // A normal `next build` must not create OpenNext output. The directory exists
  // only when this build was started by opennextjs-cloudflare.
  if (existsSync(openNextBuildDir) && existsSync(source) && !existsSync(output)) {
    await build({
      entryPoints: [source],
      outfile: output,
      bundle: true,
      format: "esm",
      target: ["es2020"],
      conditions: ["worker", "browser"],
      platform: "browser",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });
    console.log("OpenNext Windows compatibility: regenerated open-next.config.edge.mjs");
  }
}
