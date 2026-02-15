#!/usr/bin/env node

/**
 * Script to update version and release notes
 * Usage: node scripts/update-version.js <version> [--major|--minor|--patch]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Parse conventional commits between two git refs
 */
function getConventionalCommits(fromTag, toTag = 'HEAD') {
  try {
    const range = fromTag ? `${fromTag}..${toTag}` : toTag;
    const format = '%H|%s|%b|%an|%ae';
    const log = execSync(`git log ${range} --format="${format}"`, { encoding: 'utf8' });
    
    const commits = log.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split('|');
      const hash = parts[0];
      const subject = parts[1] || '';
      const body = parts[2] || '';
      const author = parts[3] || '';
      const email = parts[4] || '';
      
      // Parse conventional commit format: type(scope): subject
      const conventionalMatch = subject.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
      
      return {
        hash: hash.substring(0, 7),
        subject,
        body,
        author,
        email,
        type: conventionalMatch ? conventionalMatch[1] : 'other',
        scope: conventionalMatch ? conventionalMatch[2] : null,
        description: conventionalMatch ? conventionalMatch[3] : subject
      };
    });
    
    return commits;
  } catch (error) {
    console.log('⚠️  Could not parse git commits:', error.message);
    return [];
  }
}

/**
 * Get PR number from commit message or body
 */
function getPRNumber(commit) {
  const prMatch = (commit.subject + ' ' + commit.body).match(/#(\d+)/);
  return prMatch ? prMatch[1] : null;
}

/**
 * Get new contributors since last tag
 */
async function getNewContributors(fromTag, owner, repo) {
  try {
    const range = fromTag ? `${fromTag}..HEAD` : 'HEAD';
    
    // Get all contributors in current range with their first commit in range
    const format = '%ae|%an|%H';
    const currentLog = execSync(
      `git log ${range} --format="${format}"`,
      { encoding: 'utf8' }
    );
    
    const currentCommits = currentLog.trim().split('\n').filter(Boolean);
    const contributorFirstCommit = new Map();
    
    // Track first appearance in current range (reverse order = chronological)
    for (let i = currentCommits.length - 1; i >= 0; i--) {
      const [email, author, hash] = currentCommits[i].split('|');
      if (!contributorFirstCommit.has(email)) {
        contributorFirstCommit.set(email, { author, hash, email });
      }
    }
    
    // Check which contributors are new (no commits before fromTag)
    const newContributors = [];
    
    for (const [email, info] of contributorFirstCommit) {
      let isNew = false;
      
      if (fromTag) {
        // Check if contributor has any commits before the tag
        try {
          const beforeTag = execSync(
            `git log ${fromTag} --author="${email}" --format="%H"`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
          ).trim();
          
          isNew = beforeTag === '';
        } catch {
          isNew = true;
        }
      } else {
        // No previous tag, so this is their first commit in the repo
        isNew = true;
      }
      
      if (isNew) {
        // Find PR number from the commit
        const commitFormat = '%s%n%b';
        const commitInfo = execSync(
          `git log -1 --format="${commitFormat}" ${info.hash}`,
          { encoding: 'utf8' }
        );
        const prMatch = commitInfo.match(/#(\d+)/);
        
        newContributors.push({
          author: info.author,
          email: info.email,
          pr: prMatch ? prMatch[1] : null
        });
      }
    }
    
    return newContributors;
  } catch (error) {
    console.log('⚠️  Could not determine new contributors:', error.message);
    return [];
  }
}

/**
 * Format commits by type for release notes
 */
function formatReleaseNotes(commits, owner, repo) {
  const typeLabels = {
    feat: '✨ Features',
    fix: '🐛 Bug Fixes',
    docs: '📚 Documentation',
    style: '💎 Styles',
    refactor: '♻️ Code Refactoring',
    perf: '⚡ Performance Improvements',
    test: '✅ Tests',
    build: '🏗️ Build System',
    ci: '👷 CI/CD',
    chore: '🔧 Chores',
    revert: '⏪ Reverts',
    other: '📝 Other Changes'
  };
  
  const grouped = {};
  
  for (const commit of commits) {
    const type = commit.type in typeLabels ? commit.type : 'other';
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(commit);
  }
  
  let markdown = '';
  
  // Order by importance
  const order = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert', 'other'];
  
  for (const type of order) {
    if (grouped[type]) {
      markdown += `### ${typeLabels[type]}\n\n`;
      
      for (const commit of grouped[type]) {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        const pr = getPRNumber(commit);
        const prLink = pr ? ` ([#${pr}](https://github.com/${owner}/${repo}/pull/${pr}))` : '';
        const commitLink = `([${commit.hash}](https://github.com/${owner}/${repo}/commit/${commit.hash}))`;
        
        markdown += `- ${scope}${commit.description} ${commitLink}${prLink}\n`;
      }
      
      markdown += '\n';
    }
  }
  
  return markdown.trim();
}

async function createGitHubRelease(version, changes, useConventionalCommits = false) {
  try {
    // Get repository info from git remote
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
    const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    
    if (!match) {
      console.log('⚠️  Could not parse GitHub repository from remote URL');
      return false;
    }

    const [, owner, repo] = match;
    const tag = `v${version}`;
    
    let body;
    
    if (useConventionalCommits) {
      // Get last tag
      let lastTag;
      try {
        lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
      } catch {
        lastTag = null;
      }
      
      console.log(`\n📊 Analyzing commits${lastTag ? ` since ${lastTag}` : ''}...`);
      const commits = getConventionalCommits(lastTag);
      
      if (commits.length === 0) {
        console.log('⚠️  No commits found. Using manual release notes.');
        body = changes.map(c => `- ${c}`).join('\n');
      } else {
        body = formatReleaseNotes(commits, owner, repo);
        
        // Add new contributors section
        const newContributors = await getNewContributors(lastTag, owner, repo);
        if (newContributors.length > 0) {
          body += '\n\n### 🎉 New Contributors\n\n';
          for (const contributor of newContributors) {
            // Try to get GitHub username from git config
            let username = contributor.author;
            try {
              const gitHubUser = execSync(
                `git config --get user.github`,
                { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
              ).trim();
              if (gitHubUser) {
                username = gitHubUser;
              }
            } catch {
              // Use author name as fallback
            }
            
            const prLink = contributor.pr ? ` in [#${contributor.pr}](https://github.com/${owner}/${repo}/pull/${contributor.pr})` : '';
            body += `- **${contributor.author}**${prLink} made their first contribution!\n`;
          }
        }
        
        body += '\n\n**Full Changelog**: ';
        if (lastTag) {
          body += `https://github.com/${owner}/${repo}/compare/${lastTag}...${tag}`;
        } else {
          body += `https://github.com/${owner}/${repo}/commits/${tag}`;
        }
      }
    } else {
      // Use manual changes
      body = changes.map(c => `- ${c}`).join('\n');
    }
    
    // Check if gh CLI is available
    try {
      execSync('gh --version', { stdio: 'ignore' });
    } catch {
      console.log('\n⚠️  GitHub CLI (gh) not found. Install it to enable automatic releases:');
      console.log('   https://cli.github.com/');
      return false;
    }

    // Create release using gh CLI
    // Write body to temp file to avoid command line length issues
    const tempFile = path.join(__dirname, '.release-notes.tmp');
    fs.writeFileSync(tempFile, body);
    
    const releaseCmd = `gh release create "${tag}" --title "${tag}" --notes-file "${tempFile}"`;
    
    console.log('\n📦 Creating GitHub release...');
    execSync(releaseCmd, { stdio: 'inherit' });
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    console.log(`✓ GitHub release created: https://github.com/${owner}/${repo}/releases/tag/${tag}`);
    
    return true;
  } catch (error) {
    console.log(`\n⚠️  Failed to create GitHub release: ${error.message}`);
    return false;
  }
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
  
  // Always use conventional commits
  let lastTag;
  try {
    lastTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  } catch {
    lastTag = null;
  }
  
  console.log(`\n📊 Analyzing commits${lastTag ? ` since ${lastTag}` : ' (all time)'}...`);
  const commits = getConventionalCommits(lastTag);
  
  if (commits.length === 0) {
    console.log('⚠️  No commits found. Please make some commits first.');
    rl.close();
    return;
  }
  
  console.log(`Found ${commits.length} commits to include in release notes.\n`);

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Updated package.json to ${newVersion}`);

  // Save to version history
  const historyPath = path.join(__dirname, '../CHANGELOG.md');
  let changelog = '';
  
  if (fs.existsSync(historyPath)) {
    changelog = fs.readFileSync(historyPath, 'utf8');
  } else {
    changelog = '# Changelog\n\n';
  }

  const releaseDate = new Date().toISOString().split('T')[0];
  const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim();
  const match = remoteUrl.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  const [, owner, repo] = match || ['', 'unknown', 'unknown'];
  
  const formattedNotes = formatReleaseNotes(commits, owner, repo);
  let newEntry = `## [${newVersion}] - ${releaseDate}\n\n${formattedNotes}\n\n`;
  
  const insertIndex = changelog.indexOf('\n## [') > 0 ? changelog.indexOf('\n## [') : changelog.length;
  changelog = changelog.slice(0, insertIndex) + '\n' + newEntry + changelog.slice(insertIndex);
  
  fs.writeFileSync(historyPath, changelog);
  console.log(`✓ Updated CHANGELOG.md`);

  console.log('\n✅ Version update complete!');
  console.log('\nNext steps:');
  console.log('1. Review the changes');
  console.log('2. Commit: git add . && git commit -m "chore: release v' + newVersion + '"');
  console.log('3. Tag: git tag v' + newVersion);
  console.log('4. Push: git push && git push --tags');
  
  // Ask if user wants to create GitHub release
  const createRelease = await question('\nCreate GitHub release now? (y/N): ');
  
  if (createRelease.toLowerCase() === 'y' || createRelease.toLowerCase() === 'yes') {
    // First commit and tag
    try {
      console.log('\n📝 Committing changes...');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "chore: release v${newVersion}"`, { stdio: 'inherit' });
      console.log('✓ Changes committed');
      
      console.log(`\n🏷️  Creating tag v${newVersion}...`);
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
      console.log('✓ Tag created');
      
      console.log('\n🚀 Pushing changes...');
      execSync('git push', { stdio: 'inherit' });
      execSync('git push --tags', { stdio: 'inherit' });
      console.log('✓ Changes pushed');
      
      // Now create the release
      await createGitHubRelease(newVersion, [], true);
      
    } catch (error) {
      console.log(`\n⚠️  Failed to commit/push: ${error.message}`);
      console.log('You can manually run:');
      console.log(`  git add . && git commit -m "chore: release v${newVersion}"`);
      console.log(`  git tag v${newVersion}`);
      console.log('  git push && git push --tags');
    }
  }

  rl.close();
}

main().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});