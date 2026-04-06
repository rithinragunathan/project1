const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log('Starting install...');
    const output = execSync('npm install bcryptjs --verbose', { cwd: __dirname, encoding: 'utf8' });
    fs.writeFileSync('install_debug.log', 'SUCCESS:\n' + output);
    console.log('Install success');
} catch (e) {
    console.error('Install failed');
    const logContent = 'STDOUT:\n' + (e.stdout || '') + '\n\nSTDERR:\n' + (e.stderr || '') + '\n\nMESSAGE:\n' + e.message;
    fs.writeFileSync('install_debug.log', logContent);
}
