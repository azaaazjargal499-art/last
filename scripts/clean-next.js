const fs = require('fs');
const path = require('path');

const nextDirs = ['.next', '.next-dev'];

for (const dir of nextDirs) {
  const nextDir = path.join(__dirname, '..', 'frontend', dir);

  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log(`[clean] removed frontend/${dir}`);
  }
}
