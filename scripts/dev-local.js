import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const setup = spawnSync(process.execPath, ["scripts/setup-local.js"], {
  cwd: root,
  stdio: "inherit",
});

if (setup.status !== 0) {
  process.exit(setup.status ?? 1);
}

const compose = spawnSync("docker", ["compose", "-f", "backend/docker-compose.yml", "up", "-d"], {
  cwd: root,
  stdio: "inherit",
});

if (compose.error || compose.status !== 0) {
  console.error("Could not start MongoDB and Redis. Install Docker Desktop and try again.");
  process.exit(compose.status ?? 1);
}

const services = [
  ["frontend", "frontend"],
  ["gateway", "backend/gateway"],
  ["auth", "backend/services/auth"],
  ["resume", "backend/services/resume"],
  ["interview", "backend/services/interview"],
  ["roadmap", "backend/services/roadmap"],
  ["billing", "backend/services/billing"],
];

const children = services.map(([name, cwd]) => {
  if (!existsSync(resolve(root, cwd))) {
    throw new Error(`Cannot start ${name}: directory does not exist (${cwd})`);
  }

  const child = spawn(npmCommand, ["run", "dev"], {
    cwd: resolve(root, cwd),
    stdio: "inherit",
    shell: false,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.on("exit", (code, signal) => {
    if (code !== 0 && signal === null) {
      console.error(`${name} stopped with exit code ${code}.`);
      stopAll(code ?? 1);
    }
  });

  return child;
});

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on("SIGINT", () => stopAll());
process.on("SIGTERM", () => stopAll());
