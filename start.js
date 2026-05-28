const { spawn } = require('child_process');
const path = require('path');

console.log('\n🤖 AI Interview Guardian Orchestrator calibrating system nodes...');

// Spawn backend server process
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Spawn frontend dev server process
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Graceful cleanup of child processes on termination signal (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n\x1b[31m[HALTING SECURE DATA FEED] Releasing telemetry servers...\x1b[0m');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit();
});

// Render the beautiful cyber telemetric banner after Vite and Express initiate
setTimeout(() => {
  console.log(`
\x1b[32m====================================================================
🛡️  AI INTERVIEW GUARDIAN — COGNITION DECK BOOTED AND ACTIVE
====================================================================\x1b[0m
🌐 FRONTEND DASHBOARD PORTAL:  \x1b[36m\x1b[4mhttp://localhost:5173\x1b[0m
📡 BACKEND AI TELEMETRY PORTAL: \x1b[36m\x1b[4mhttp://localhost:5000\x1b[0m
====================================================================
\x1b[35m[Telemetry Sweep Rate: 3000ms // Live Face Tracking active in browser]\x1b[0m
\x1b[33m👉 Press Ctrl+C at any time to suspend data streams and shutdown.\x1b[0m
  `);
}, 2500);
