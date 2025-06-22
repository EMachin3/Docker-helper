//import { spawn } from 'child_process';
//import { fileURLToPath } from 'url';
//import { dirname, path } from 'path';
const { spawn } = require("child_process");
const { fileURLToPath } = require("url");
const path = require("path");

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = path.dirname(__filename);

//const __filename = fileURLToPath(import.meta.url);
//const __dirname = dirname(__filename);

// Start Backend
const backend = spawn("npm", ["run", "dev", "--prefix", "backend"], {
  stdio: "inherit",
});

// Start Frontend (using npm run dev or a build version)
const frontend = spawn("npm", ["run", "dev", "--prefix", "frontend"], {
  stdio: "inherit",
});

// Handle process exit
process.on("SIGINT", () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
