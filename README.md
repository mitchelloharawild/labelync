# Labelync

![Labelync Banner](.github/banner.svg)

**Labelync** (label + sync) allows you to wirelessly print to Bluetooth label printers directly from your web browser. Install it as a PWA on your phone or computer to print from anywhere, even without an internet connection.

This app uses the [Web Serial API over Bluetooth](https://developer.chrome.com/blog/serial-over-bluetooth/), which requires a modern Chromium-based web browser (Chrome/Chromium 89+, Microsoft Edge 89+, Opera 75+). Safari and Firefox do not currently support the Web Serial API.

> **Disclaimer:** This project was mostly vibe-coded with Claude 🤖
> 
> Please report any issues here: <https://github.com/mitchelloharawild/labelync/issues>

## 🚀 Quick Start

Simply visit <https://pkg.mitchelloharawild.com/labelync> to start using the app immediately - no installation required!

## 🖨️ Supported Printers

* ✅ **Phomemo M110**
* ❓ **Phomemo M120** (untested)
* ❓ **Phomemo M220** (untested)
* 🧪 **Phomemo M02** (experimental, untested on real hardware)
* 🧪 **Phomemo M02 Pro** (experimental, untested on real hardware)
* 🧪 **Phomemo M02S** (experimental, untested on real hardware)
* 🧪 **Phomemo T02** (experimental, untested on real hardware)

I personally own and use a Phomemo M110, and I have not been able to test other devices. All other implementations are based on the fantastic [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools) project.

The M02/M02 Pro/M02S/T02 family speaks a different (plain ESC/POS) protocol than the M110/M120/M220 family. That protocol path is implemented from the reverse-engineered docs only — I don't own one of these printers, so it's **best-effort and unverified against real hardware**. In particular, darkness and print-speed controls aren't documented for this family, so labelync doesn't expose or send them for these models; the paper width is also fixed at 48mm rather than user-configurable.

**Have a different Phomemo printer?** Please create an issue reporting if this web app works for you (or doesn't) — this is especially appreciated for the M02 family, since it would let me move it out of "experimental" status.

## ✨ Features

- ⚡ **Direct Connection** - Connect to Phomemo printers via Web Serial API over Bluetooth
- 🖨️ **Device-Specific Settings** - Printer-specific device and paper configuration
- 📱 **Progressive Web App** - Install on desktop and mobile devices for offline access
- 🎯 **Real-time Preview** - See exactly what will print before sending to device
- 💾 **Save Settings** - Your printer and paper settings are remembered between sessions
- 🔒 **Privacy First** - All processing happens locally in your browser
- 🎨 **SVG Templates** - Use customizable SVG templates with replaceable content
- 📅 **Special Field Types** - Support for dates, QR codes, and image uploads in templates
- 🎭 **Image Dithering** - Floyd-Steinberg dithering of colours for quality thermal printing

## 📖 Usage Guide

1. **Access the app** - Navigate to <https://pkg.mitchelloharawild.com/labelync>
2. **Connect printer** 
   - Click the "Connect printer" button
   - Select your Phomemo printer from the device list
   - Grant the necessary permissions
3. **Configure paper settings**
   - Choose your label's paper type
   - Set the appropriate page size
   - Save your configuration
4. **Choose or create a template**
   - Select from built-in templates (see [Template Examples](examples/README.md))
   - Upload your own SVG template (see [Template Documentation](docs/templates.md))
   - Templates support text, dates, QR codes, and images
5. **Design your label** - Fill in the form fields:
   - **Text fields**: Type your content
   - **Date fields**: Pick a date using the date picker
   - **QR code fields**: Enter text/URL to encode
   - **Image fields**: Upload photos or logos
6. **Preview** - Review your design in the real-time canvas preview
7. **Print** - Click "🖨 Print Sticker" to send to your printer

### Installing as a PWA

- **Desktop:** Look for the install icon in your browser's address bar
- **Mobile:** Use your browser's "Add to Home Screen" option

# 💻 Development

## Architecture

The Phomemo wire protocol (image → printer bytes) and the Web Serial
transport live in a separate package,
[phomemo-protocol](https://github.com/mitchelloharawild/phomemo-protocol)
([npm](https://www.npmjs.com/package/phomemo-protocol)), so they can be
reused outside this app. Labelync itself only handles the UI, SVG template
rendering, and local settings storage.

## Installation

```bash
# Clone the repository
git clone https://github.com/mitchelloharawild/labelync.git
cd labelync

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Releases

See [Version Management Guide](docs/versioning.md) for release instructions.


## 📄 License

MIT

## 🙏 Acknowledgments

- [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools) - Reference implementation for Phomemo printer protocols
- [phomemo-protocol](https://github.com/mitchelloharawild/phomemo-protocol) - This app's Phomemo protocol encoder and Web Serial transport, extracted as a standalone library
- [Web Serial API](https://developer.chrome.com/articles/serial/) - Browser API documentation
