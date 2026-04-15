import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const frontendRoot = path.resolve(backendRoot, "../frontend");
const frontendDist = path.join(frontendRoot, "dist");
const targetPublic = path.join(backendRoot, "public");

const run = (cmd, cwd) => {
  console.log(`\n▶ ${cmd}  (in ${cwd})`);
  execSync(cmd, { cwd, stdio: "inherit" });
};

run("npm install", frontendRoot);
run("npm run build", frontendRoot);

fs.rmSync(targetPublic, { recursive: true, force: true });
fs.mkdirSync(targetPublic, { recursive: true });
fs.cpSync(frontendDist, targetPublic, { recursive: true });

console.log(`\n✅ Frontend built and copied to ${targetPublic}`);
