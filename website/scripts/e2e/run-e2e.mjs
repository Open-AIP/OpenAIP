import { spawn } from "node:child_process";

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(typeof code === "number" ? code : 1);
    });
  });
}

async function main() {
  const passthroughArgs = process.argv.slice(2);
  const playwrightExitCode = await runCommand("npx", ["playwright", "test", ...passthroughArgs]);

  const matrixExitCode = await runCommand(process.execPath, ["scripts/e2e/write-playwright-matrix.mjs"]);
  if (matrixExitCode !== 0) {
    console.error(`Compatibility matrix generation failed with exit code ${matrixExitCode}.`);
  }

  process.exit(playwrightExitCode);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
