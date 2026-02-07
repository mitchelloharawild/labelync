# Version Management Guide

This guide explains how to manage versions and release notes for the PWA.

## Quick Start

### Creating a New Release

1. **Update version and create release notes:**
   ```bash
   # For a patch release (1.0.0 -> 1.0.1)
   npm run version:patch

   # For a minor release (1.0.0 -> 1.1.0)
   npm run version:minor

   # For a major release (1.0.0 -> 2.0.0)
   npm run version:major
   ```

2. **Enter your release notes** when prompted (one per line, press Enter twice when done)

3. **Review the changes:**
   - `package.json` - version updated
   - `public/release-notes.json` - current release notes
   - `CHANGELOG.md` - historical record

4. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   ```

5. **Push to trigger deployment:**
   ```bash
   git push && git push --tags
   ```

## What Happens Automatically

When you push a version tag (e.g., `v1.0.1`):

1. **GitHub Actions** workflow triggers
2. App is **built** with the new version
3. **GitHub Release** is created with your release notes
4. App is **deployed** to GitHub Pages
5. Users see **update notification** with version and changes

## Update Notification

When users have the app open and a new version is deployed:

- A notification appears at the bottom of the screen
- Shows the **version number** (e.g., "v1.0.1")
- Displays **"What's new?"** expandable section with release notes
- Users can **update immediately** or dismiss for later
- Updates are checked **every hour** automatically

## File Structure

```
├── public/
│   └── release-notes.json      # Current version info (shown to users)
├── scripts/
│   └── update-version.js       # Version management script
├── CHANGELOG.md                # Historical record of all versions
└── package.json                # NPM package version
```

## Release Notes Format

The `release-notes.json` file contains:

```json
{
  "version": "1.0.1",
  "date": "2026-02-07",
  "changes": [
    "Fixed printer connection issues",
    "Improved paper detection",
    "Added new templates"
  ]
}
```

This file is:
- **Fetched by users** when an update is available
- **Displayed in the update notification**
- **Automatically updated** by the version script

## Best Practices

### Semantic Versioning

- **Major (1.0.0 → 2.0.0)**: Breaking changes
- **Minor (1.0.0 → 1.1.0)**: New features, backward compatible
- **Patch (1.0.0 → 1.0.1)**: Bug fixes, backward compatible

### Writing Good Release Notes

✅ **Good:**
- "Fixed printer connection timeout on Android devices"
- "Added support for 40mm thermal paper"
- "Improved QR code print quality"

❌ **Avoid:**
- "Bug fixes"
- "Improvements"
- "Updated code"

### Release Frequency

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Every 1-2 weeks for new features
- **Major releases**: When making breaking changes

## Manual Version Update

If you need to manually edit version info:

1. Edit `package.json` version
2. Edit `public/release-notes.json`
3. Add entry to `CHANGELOG.md`
4. Commit, tag, and push

## Testing Updates Locally

To test the update notification in development:

1. Start dev server: `npm run dev`
2. Make changes to your code
3. Update `release-notes.json` with a new version
4. The notification should appear (due to `devOptions.enabled: true`)

## Troubleshooting

### Users not seeing updates

- Check that `registerType: 'prompt'` is set in `vite.config.ts`
- Verify `release-notes.json` is in the `public/` folder
- Ensure service worker is registered (check browser DevTools → Application → Service Workers)

### GitHub Actions not deploying

- Verify the tag format is `v*` (e.g., `v1.0.1`)
- Check GitHub Actions permissions (Settings → Actions → General)
- Review workflow logs in the Actions tab

### Update notification not showing version

- Confirm `release-notes.json` is accessible at `/release-notes.json`
- Check browser console for fetch errors
- Verify JSON format is correct
