#!/usr/bin/env node

/**
 * Script to update version and release notes
 * Usage: node scripts/update-version.js <version> [--major|--minor|--patch]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  let newVersion = args[0];

  // Read current package.json
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;

  console.log(`Current version: ${currentVersion}`);

  // Auto-increment if flag provided
  if (!newVersion || newVersion.startsWith('--')) {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const flag = newVersion || '--patch';
    
    switch (flag) {
      case '--major':
        newVersion = `${major + 1}.0.0`;
        break;
      case '--minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case '--patch':
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }
  }

  console.log(`New version will be: ${newVersion}`);
  
  // Get release notes
  console.log('\nEnter release notes (one per line, press Enter twice when done):');
  const changes = [];
  let emptyLineCount = 0;
  
  while (emptyLineCount < 2) {
    const line = await question('- ');
    if (line.trim() === '') {
      emptyLineCount++;
    } else {
      emptyLineCount = 0;
      changes.push(line.trim());
    }
  }

  if (changes.length === 0) {
    console.log('No changes entered. Aborting.');
    rl.close();
    return;
  }

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json to ${newVersion}`);

  // Update release notes
  const releaseNotesPath = path.join(__dirname, '../public/release-notes.json');
  const releaseNotes = {
    version: newVersion,
    date: new Date().toISOString().split('T')[0],
    changes: changes
  };
  fs.writeFileSync(releaseNotesPath, JSON.stringify(releaseNotes, null, 2) + '\n');
  console.log(`✓ Updated release-notes.json`);

  // Save to version history
  const historyPath = path.join(__dirname, '../CHANGELOG.md');
  let changelog = '';
  
  if (fs.existsSync(historyPath)) {
    changelog = fs.readFileSync(historyPath, 'utf8');
  } else {
    changelog = '# Changelog\n\n';
  }

  const newEntry = `## [${newVersion}] - ${releaseNotes.date}\n\n${changes.map(c => `- ${c}`).join('\n')}\n\n`;
  const insertIndex = changelog.indexOf('\n## [') > 0 ? changelog.indexOf('\n## [') : changelog.length;
  changelog = changelog.slice(0, insertIndex) + '\n' + newEntry + changelog.slice(insertIndex);
  
  fs.writeFileSync(historyPath, changelog);
  console.log(`✓ Updated CHANGELOG.md`);

  console.log('\n✅ Version update complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Commit: git add . && git commit -m "Release v' + newVersion + '"');
  console.log('3. Tag: git tag v' + newVersion);
  console.log('4. Push: git push && git push --tags');
  console.log('5. Build and deploy: npm run build');

  rl.close();
}

main().catch(console.error);
