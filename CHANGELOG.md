# Changelog

## [2.0.0] - 2026-09-20

### ✨ Features

- add CSV batch printing ([e4ddb10](https://github.com/mitchelloharawild/phomemo-pwa/commit/e4ddb10))
- add experimental support for Phomemo M02/M02 Pro/M02S/T02 printers ([3de0d6d](https://github.com/mitchelloharawild/phomemo-pwa/commit/3de0d6d))
- add barcode field type alongside QR support ([b25e5b7](https://github.com/mitchelloharawild/phomemo-pwa/commit/b25e5b7))
- wire up light/dark theme toggle ([7e197cb](https://github.com/mitchelloharawild/phomemo-pwa/commit/7e197cb))
- add one-click reconnect to previously authorized printers ([5fe1625](https://github.com/mitchelloharawild/phomemo-pwa/commit/5fe1625))
- surface print job success/failure notifications ([74076d8](https://github.com/mitchelloharawild/phomemo-pwa/commit/74076d8))
- add copies stepper for printing multiple labels ([a8d0908](https://github.com/mitchelloharawild/phomemo-pwa/commit/a8d0908))
- redesign app shell with responsive icon rail and split preview ([c793503](https://github.com/mitchelloharawild/phomemo-pwa/commit/c793503))
- add TopBar, Toolbar, and ActionBar components ([b338392](https://github.com/mitchelloharawild/phomemo-pwa/commit/b338392))
- add CSS design tokens for the dark theme palette ([7d46064](https://github.com/mitchelloharawild/phomemo-pwa/commit/7d46064))

### 🐛 Bug Fixes

- letterbox template preview instead of stretching to paper size ([fb16b67](https://github.com/mitchelloharawild/phomemo-pwa/commit/fb16b67))
- refresh date fields to today when loading a template ([6db6f69](https://github.com/mitchelloharawild/phomemo-pwa/commit/6db6f69))

### ♻️ Code Refactoring

- extract printer protocol into phomemo-protocol library ([b9b7885](https://github.com/mitchelloharawild/phomemo-pwa/commit/b9b7885))

### 📚 Documentation

- Add vibe-code disclaimer back to README ([3b7af6c](https://github.com/mitchelloharawild/phomemo-pwa/commit/3b7af6c))
- change banner tagline to sentence case ([9d1724c](https://github.com/mitchelloharawild/phomemo-pwa/commit/9d1724c))

### 💎 Styles

- extend dark theme and teal accent across modals and PWA UI ([85198b5](https://github.com/mitchelloharawild/phomemo-pwa/commit/85198b5))

### 📝 Other Changes

- Add dithering to README ([2745ef9](https://github.com/mitchelloharawild/phomemo-pwa/commit/2745ef9))


## [1.1.0] - 2026-02-15

This release rebrands the project to labelync, along with icons and banners.

### 📚 Documentation

- Rebrand to labelync ([eb8905c](https://github.com/mitchelloharawild/phomemo-pwa/commit/eb8905c))
- Update logo ([849d0c7](https://github.com/mitchelloharawild/phomemo-pwa/commit/849d0c7))
- Update README ([5e531f2](https://github.com/mitchelloharawild/phomemo-pwa/commit/5e531f2))
- Add labelync banner ([46fb162](https://github.com/mitchelloharawild/phomemo-pwa/commit/46fb162))

### 🏗️ Build System

- Update github release script ([8f2dd0f](https://github.com/mitchelloharawild/phomemo-pwa/commit/8f2dd0f))

### 🔧 Chores

- add opengraph image ([85af880](https://github.com/mitchelloharawild/phomemo-pwa/commit/85af880))
- Update paths for labelync project rename ([e0f6a02](https://github.com/mitchelloharawild/phomemo-pwa/commit/e0f6a02))

### 👷 CI/CD

- Update release action to deploy directly to github pages ([e36e32a](https://github.com/mitchelloharawild/phomemo-pwa/commit/e36e32a))
- Add environment to release.yml action ([3efe5e3](https://github.com/mitchelloharawild/phomemo-pwa/commit/3efe5e3))

## [1.0.2] - 2026-02-15

- Added version to main page with manual update checking button


## [1.0.1] - 2026-02-15

- Change template file picker to accept any file (preventing photo specific picker on Android)


## [1.0.0] - 2026-02-15

- Initial release with PWA support
- Single and multiple line text support
- Device specific configuration of print and paper settings
- Added support for special fields (date, qrcode, image)
- SVG based label templating support
- Optional fields (show/hide each field)
- Automatic text resizing attribute

