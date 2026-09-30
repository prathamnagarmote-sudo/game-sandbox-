# Standalone HTML5 Game Sandbox & QA Runner

A self-contained, high-performance HTML5 Game Sandbox and QA runner built with React, Vite, TypeScript, and Tailwind CSS. Extracted directly from production game-hosting specifications to verify responsive portrait and landscape execution on all devices with zero server-side dependencies.

---

## Features

- **In-Memory Asset Decompression & Interception**: Drag-and-drop or browse any `.zip` game archive containing `index.html`. Assets are decompressed in-browser using JSZip, generating virtual blob URLs with complete path mapping and request interception.
- **3-Step Guided Workflow**:
  1. **Upload Game Package**: Choose or drop `.zip` file.
  2. **Configure Orientation & Aspect Ratio**: Choose Portrait (`9:16`, `3:4`, `2:3`) or Landscape (`16:9`, `4:3`, `3:2`).
  3. **Launch Game**: Mounts the game directly into the sandbox runtime.
- **Dimension Lock**: Once launched, dimensions are strictly locked during gameplay to preserve game canvas integrity.
- **Custom Background Thumbnail**: Upload crisp, unblurred game key art / background images displayed behind the container and vertical game viewports.
- **MultiGaming Safe Space Bars**:
  - **PC Fullscreen Top Bar**: 30px compact bar with game title, Fullscreen Mode badge, dimension lock status, Hide Space toggle, and exit button.
  - **Hide Space**: Toggles edge-to-edge view with top-center restore tab and ESC keyboard shortcut support.
  - **Mobile Safe Area Bars**: Notch safe area header for portrait and rotated vertical sidebar for landscape.

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### Building for Production

```bash
npm run build
```

---

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Bundler**: Vite
- **Archive Extraction**: JSZip
- **Icons**: Lucide React
