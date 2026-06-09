const { spawn } = require('child_process');
const path = require('path');
require('./clean-next');

const services = [
  { name: 'backend', color: '\x1b[36m', cwd: 'backend', command: 'npm run dev' },
  { name: 'frontend', color: '\x1b[35m', cwd: 'frontend', command: 'npm run dev' },
];

const reset = '\x1b[0m';
const children = [];
let shuttingDown = false;

function prefixLines(service, chunk) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length > 0) {
      console.log(`${service.color}[${service.name}]${reset} ${line}`);
    }
  }
}

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
          stdio: 'ignore',
          windowsHide: true,
        });
      } else {
        child.kill('SIGTERM');
      }
    }
  }

  setTimeout(() => process.exit(exitCode), 300);
}

for (const service of services) {
  const child = spawn(service.command, {
    cwd: path.join(__dirname, '..', service.cwd),
    shell: true,
    env: { ...process.env },
  });

  children.push(child);
  child.stdout.on('data', (chunk) => prefixLines(service, chunk));
  child.stderr.on('data', (chunk) => prefixLines(service, chunk));

  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.error(`${service.color}[${service.name}]${reset} stopped with code ${code}`);
      stopAll(code || 1);
    }
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
