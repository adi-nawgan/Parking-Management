const { execSync } = require('child_process');

const port = process.argv[2];
if (!port) {
  console.error('Please specify a port.');
  process.exit(1);
}

try {
  if (process.platform === 'win32') {
    // Windows: Find PID using netstat and kill it
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split('\n');
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        // netstat output format: Protocol LocalAddress ForeignAddress State PID
        const pid = parts[parts.length - 1];
        if (parseInt(pid) > 0) {
          pids.add(pid);
        }
      }
    }
    for (const pid of pids) {
      console.log(`[Kill Port] Killing process ${pid} on port ${port}...`);
      try {
        execSync(`taskkill /F /PID ${pid}`);
      } catch (err) {
        // ignore if already dead
      }
    }
  } else {
    // macOS/Linux: Find PID using lsof and kill it
    try {
      const pid = execSync(`lsof -t -i:${port}`).toString().trim();
      if (pid) {
        console.log(`[Kill Port] Killing process ${pid} on port ${port}...`);
        execSync(`kill -9 ${pid}`);
      }
    } catch (err) {
      // lsof exits with 1 if no process is found
    }
  }
} catch (error) {
  // If netstat/findstr has no match, it exits with non-zero code, which throws an error.
  // We handle this gracefully since it means no process is listening on that port.
}

console.log(`[Kill Port] Port ${port} is free.`);
process.exit(0);
