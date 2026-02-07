# Phomemo M110 Sticker Printer Web App

A modern Progressive Web App (PWA) for printing custom stickers using the Phomemo M110 printer via Web Serial API.

## Features

- 🖨️ Direct connection to Phomemo M110 printer via Web Serial API
- 📱 Progressive Web App - installable on desktop and mobile
- 🎨 Custom sticker design with:
  - QR codes
  - Custom text (multi-line support)
  - Date stamps
  - Image uploads with automatic dithering
- 🎯 Real-time preview
- ⚡ Built with modern React + Vite

## Technology Stack

- **React** - UI framework
- **Vite** - Build tool and dev server
- **vite-plugin-pwa** - PWA capabilities with Workbox
- **Web Serial API** - Direct printer communication
- **QRCode** - QR code generation
- **Canvas API** - Image processing and rendering

## Prerequisites

- Node.js 16+ and npm
- A browser with Web Serial API support (Chrome, Edge, Opera)
- Phomemo M110 printer

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Start the app** - Open in a Web Serial API compatible browser
2. **Connect printer** - Click "Connect printer" and select your Phomemo M110
3. **Design your sticker**:
   - Enter QR code content (URLs, text, etc.)
   - Set dimensions (default: 30mm x 20mm)
   - Add custom text (supports multiple lines)
   - Toggle date stamp
   - Upload images (automatically converted to B&W)
4. **Preview** - See real-time preview on canvas
5. **Print** - Click "🖨 Print Sticker"

## PWA Features

The app can be installed as a PWA with:
- Offline functionality
- App-like experience
- Automatic updates
- Cached assets for faster loading

## Project Structure

```
phomemo-printer-app/
├── src/
│   ├── components/
│   │   ├── PrinterForm.jsx      # Form inputs
│   │   ├── PrinterForm.css
│   │   ├── PrinterCanvas.jsx    # Canvas preview
│   │   └── PrinterCanvas.css
│   ├── hooks/
│   │   ├── usePrinter.js        # Printer connection/communication
│   │   └── useCanvas.js         # Canvas rendering logic
│   ├── App.jsx                  # Main app component
│   ├── App.css
│   ├── main.jsx                 # Entry point
│   └── index.css
├── vite.config.js               # Vite + PWA configuration
└── package.json
```

## Browser Compatibility

The Web Serial API is required and supported in:
- Chrome 89+
- Edge 89+
- Opera 75+

Note: Firefox and Safari do not currently support Web Serial API.

## Printer Configuration

Default settings (can be modified in `src/hooks/usePrinter.js`):
- Darkness: 0x08 (range: 0x01 - 0x0f)
- Speed: 0x05 (range: 0x01 - 0x05)
- Paper type: 0x0a (Label with gaps)

## Development

### Custom Hooks

- **usePrinter** - Manages printer connection and printing
- **useCanvas** - Handles canvas rendering and updates

### Components

- **PrinterForm** - Input form for sticker configuration
- **PrinterCanvas** - Canvas preview component

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory and includes:
- Minified assets
- Service worker for offline support
- PWA manifest
- Optimized images

## Deployment

Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting
- etc.

Make sure HTTPS is enabled for PWA and Web Serial API functionality.

## Credits

Adapted from the original Phomemo printer web interface by [bdm-k](https://gist.github.com/bdm-k/fe903491a051251db688866b7d554065).

## License

MIT
