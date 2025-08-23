# Screen Recorder Chrome Extension

A powerful Chrome extension for capturing screenshots and recording screen videos with an integrated in-browser video editor, similar to Loom.

## Features

### 🖼️ Screenshot Capture
- Capture high-quality screenshots of the current tab
- Preview screenshots before downloading
- Copy screenshots to clipboard
- Download screenshots with custom naming

### 🎥 Screen Recording
- Record screen, window, or specific tab
- High-quality video recording (VP9/VP8 codec support)
- Real-time recording timer
- Automatic recording preview after completion

### ✂️ In-Browser Video Editor
- **Full-featured video editor** with professional tools
- **Video trimming** - Cut videos to specific start/end times
- **Playback controls** - Play, pause, seek, volume, and speed adjustment
- **Segment management** - Create, edit, and organize video segments
- **Frame capture** - Extract individual frames as images
- **Multiple editing modes**:
  - Popup editor for quick edits
  - Full-screen editor in new tab for detailed work

### 🎯 User Experience
- Modern, intuitive UI with Tailwind CSS
- Tab-based navigation between screenshot and recording features
- Responsive design that works on different screen sizes
- Error handling and user feedback
- Loading states and progress indicators

## Installation

### Development Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd screen-rec
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build
```bash
npm run build
```
The built extension will be available in the `dist` folder, ready for distribution.

## Usage

### Screenshots
1. Click the extension icon in your browser
2. Navigate to the "Screenshots" tab
3. Click "Capture Screenshot" to capture the current tab
4. Preview, copy, or download the screenshot

### Screen Recording
1. Click the extension icon in your browser
2. Navigate to the "Screen Recording" tab
3. Click "Start Recording" and select what to record (screen, window, or tab)
4. Use the recording controls to stop when finished
5. The recording will automatically open in the preview mode

### Video Editing
1. After recording, use the "Edit Video" button for quick edits
2. Use "Full-Screen Editor" for detailed video editing in a new tab
3. Available editing features:
   - **Trim**: Set start and end points for your video
   - **Segments**: Create and manage video segments
   - **Frame Capture**: Extract specific frames as images
   - **Playback Controls**: Adjust speed, volume, and navigation

## Technical Details

### Architecture
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite with CRXJS plugin
- **Chrome APIs**: Uses Manifest V3 with modern Chrome extension APIs

### Key Components
- `MainApp`: Main application with tab navigation
- `Screenshot`: Screenshot capture functionality
- `ScreenRecording`: Screen recording with MediaRecorder API
- `VideoEditor`: Comprehensive video editing interface
- `RecordingPreview`: Video preview and editing options
- `ScreenshotPreview`: Screenshot preview and actions

### Chrome Permissions
- `sidePanel`: For side panel functionality
- `contentSettings`: For content script injection
- `tabs`: For tab management
- `activeTab`: For current tab access
- `tabCapture`: For screenshot capture
- `scripting`: For content script execution
- `storage`: For data persistence
- `desktopCapture`: For screen recording

## Browser Support

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

### Project Structure
```
src/
├── components/          # React components
├── content/            # Content scripts and views
├── popup/              # Extension popup
├── sidepanel/          # Side panel (if needed)
├── types/              # TypeScript type definitions
└── assets/             # Static assets
```

### Building and Testing
1. Make changes to the source code
2. Run `npm run build` to create a new build
3. Reload the extension in Chrome extensions page
4. Test the new functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Note**: This extension requires appropriate permissions and may need user approval for screen capture and recording functionality.
