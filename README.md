# Phomemo Label Printer Web App

A modern Progressive Web App (PWA) for printing custom stickers using the Phomemo M110 printer via Web Serial API.

> **Disclaimer:** This project was mostly vibe-coded with Claude 🤖
> Please report any issues here: <https://github.com/mitchelloharawild/phomemo-pwa/issues>

This app uses the [Web Serial API over Bluetooth](https://developer.chrome.com/blog/serial-over-bluetooth/), which requires a modern Chromium-based web browser (Chrome/Chromium 89+, Microsoft Edge 89+, Opera 75+). Safari and Firefox do not currently support the Web Serial API.

## 🖨️ Supported Printers

* ✅ **Phomemo M110**
* ❓ **Phomemo M120** (untested)
* ❓ **Phomemo M220** (untested)

I personally own and use a Phomemo M110, and I have not been able to test other devices. All other implementations are based on the fantastic [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools) project. 

**Have a different Phomemo printer?** Please create an issue reporting if this web app works for you (or doesn't)!

## 🚀 Quick Start

Simply visit <https://pkg.mitchelloharawild.com/phomemo-pwa> to start using the app immediately - no installation required!

## ✨ Features

- ⚡ **Direct Connection** - Connect to Phomemo printers via Web Serial API over Bluetooth
- 🖨️ **Device-Specific Settings** - Printer-specific device and paper configuration
- 📱 **Progressive Web App** - Install on desktop and mobile devices for offline access
- 🎯 **Real-time Preview** - See exactly what will print before sending to device
- 💾 **Save Settings** - Your printer and paper settings are remembered between sessions
- 🔒 **Privacy First** - All processing happens locally in your browser

## 📖 Usage Guide

1. **Access the app** - Navigate to <https://pkg.mitchelloharawild.com/phomemo-pwa>
2. **Connect printer** 
   - Click the "Connect printer" button
   - Select your Phomemo printer from the device list
   - Grant the necessary permissions
3. **Configure paper settings**
   - Choose your label's paper type
   - Set the appropriate page size
   - Save your configuration
4. **Design your label** - Use the form to add:
   - Text content
   - Images
   - QR codes
   - Custom formatting
5. **Preview** - Review your design in the real-time canvas preview
6. **Print** - Click "🖨 Print Sticker" to send to your printer

### Installing as a PWA

- **Desktop:** Look for the install icon in your browser's address bar
- **Mobile:** Use your browser's "Add to Home Screen" option

# 💻 Development

## Installation

```bash
# Clone the repository
git clone https://github.com/mitchelloharawild/phomemo-pwa.git
cd phomemo-pwa

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

## 📄 License

MIT

## 🙏 Acknowledgments

- [vivier/phomemo-tools](https://github.com/vivier/phomemo-tools) - Reference implementation for Phomemo printer protocols
- [Web Serial API](https://developer.chrome.com/articles/serial/) - Browser API documentation
