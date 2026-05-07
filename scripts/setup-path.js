import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const homeDir = os.homedir();
const shell = process.env.SHELL || '';

const profileFiles = [];
if (shell.includes('zsh')) {
  profileFiles.push(path.join(homeDir, '.zshrc'));
} else if (shell.includes('bash')) {
  profileFiles.push(path.join(homeDir, '.bashrc'));
} else {
  // Check both if unsure
  profileFiles.push(path.join(homeDir, '.bashrc'), path.join(homeDir, '.zshrc'));
}

// Global directories where npm/bun install global binaries
const bunBin = path.join(homeDir, '.bun', 'bin');
const npmGlobalBin = path.join(homeDir, '.npm-global', 'bin');

const pathsToCheck = [];
if (fs.existsSync(bunBin)) pathsToCheck.push(bunBin);
if (fs.existsSync(npmGlobalBin)) pathsToCheck.push(npmGlobalBin);

if (pathsToCheck.length === 0) {
  process.exit(0);
}

for (const profilePath of profileFiles) {
  if (fs.existsSync(profilePath)) {
    let content = fs.readFileSync(profilePath, 'utf8');
    let modified = false;

    for (const binPath of pathsToCheck) {
      // Very basic check to see if the path is already in the file
      if (!content.includes(binPath)) {
        content += `\n# Added by hxtp-cli\nexport PATH="${binPath}:$PATH"\n`;
        modified = true;
        console.log(`[hxtp-cli] \x1b[32m✔ Added ${binPath} to ${profilePath}\x1b[0m`);
      }
    }

    if (modified) {
      fs.writeFileSync(profilePath, content, 'utf8');
      console.log(`[hxtp-cli] \x1b[33mPlease restart your terminal or run 'source ${profilePath}' to apply changes.\x1b[0m`);
    }
  }
}
