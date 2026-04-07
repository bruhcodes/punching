import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();

function run(label: string, args: string[]) {
  const child = spawn("corepack", args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`${label} exited with code ${code}`);
      process.exit(code);
    }
  });

  return child;
}

async function main() {
  await new Promise<void>((resolve, reject) => {
    const build = spawn(
      "corepack",
      ["pnpm@9.0.0", "--filter", "@workspace/api-server", "run", "build"],
      {
        cwd: root,
        stdio: "inherit",
        shell: false,
      },
    );

    build.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`API build failed with code ${code}`));
    });
  });

  const api = run("api", ["pnpm@9.0.0", "--filter", "@workspace/api-server", "run", "start:local"]);
  const app = run("app", ["pnpm@9.0.0", "--filter", "@workspace/punch-card", "run", "dev"]);

  const shutdown = () => {
    api.kill("SIGTERM");
    app.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
