# DocsHelper - LLM-Powered Documentation Assistant

A Chrome extension that enables contextual conversations with AI about selected documentation text. Select any text on a webpage, start a chat, and get instant explanations from Claude or Gemini.

## Features

- **Quick Documentation Clarification**: Select text, start a chat, get AI-powered explanations
- **Multiple Concurrent Conversations**: Manage multiple chat rooms on the same page
- **Persistent Conversation History**: Chat rooms are saved and restored across browser sessions
- **Personalized Responses**: Configure API keys and custom system prompts
- **Shadow DOM Isolation**: Clean UI overlay that doesn't interfere with host page styling
- **Markdown Support**: Rich formatting for code blocks, links, and more in AI responses

## Installation

### From Source

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd DocsChat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from the project directory

## Development

### Prerequisites

- Node.js 18+
- npm 9+
- Chrome browser

### Development Workflow

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Load extension in Chrome**
   - Follow installation steps above
   - The extension will auto-reload on file changes

3. **Run type checking**
   ```bash
   npm run type-check
   ```

4. **Format code**
   ```bash
   npm run format
   ```

### Available Scripts

- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build extension for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Lint code with ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
DocsChat/
├── src/
│   ├── content/              # Content script (injected into web pages)
│   │   ├── components/       # React UI components
│   │   ├── hooks/            # React hooks
│   │   ├── services/         # Business logic
│   │   ├── App.tsx           # Main app component
│   │   └── index.tsx         # Entry point (Shadow DOM setup)
│   │
│   ├── background/           # Background service worker
│   │   ├── services/         # LLM service integrations
│   │   ├── messageHandler.ts # Message routing
│   │   └── index.ts          # Entry point
│   │
│   ├── options/              # Options page
│   │   ├── index.html        # Options page HTML
│   │   └── index.tsx         # Options page React app
│   │
│   └── shared/               # Shared utilities and types
│       ├── types/            # TypeScript type definitions
│       ├── constants/        # Constants and configuration
│       └── utils/            # Utility functions
│
├── public/
│   └── icons/                # Extension icons
│
├── specs/                    # Feature specifications
├── dist/                     # Build output (generated)
└── manifest.json             # Chrome extension manifest
```

## Configuration

### API Keys

1. Click the extension icon or right-click and select "Options"
2. Enter your API keys:
   - **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/settings/keys)
   - **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Click "Save Settings"

### System Prompt

Customize how the AI responds by setting a custom system prompt in the options page. Default:

```
You are a helpful assistant explaining documentation. Be concise and clear.
```

## Usage

1. **Select text** on any webpage
2. **Click "Start Chat"** button that appears
3. **Choose LLM model** (Claude or Gemini)
4. **Type your question** and press Enter or click Send
5. **View AI response** with markdown formatting

### Multiple Chat Rooms

- Create multiple chats for different text selections
- Click a collapsed chat to expand (others auto-collapse)
- Click outside to collapse all chats
- Delete chats using the × button

### Persistence

- Chat rooms automatically save to Chrome Storage
- Restored on page reload if the selected element still exists
- Invalid chats (element no longer in DOM) are automatically cleaned up

## Technical Stack

- **Framework**: React 18+ with TypeScript 5.x
- **Build Tool**: Vite with @crxjs/vite-plugin
- **UI Library**: Chakra UI (Shadow DOM compatible)
- **Markdown**: react-markdown with syntax highlighting
- **LLM SDKs**: Anthropic SDK (Claude), Google Generative AI SDK (Gemini)
- **Extension Type**: Chrome Extension Manifest V3

## Architecture

### Content Script
- Injected into all web pages
- Uses Shadow DOM for style isolation
- Manages text selection detection and chat UI

### Background Service Worker
- Handles LLM API requests (bypasses CORS)
- Manages message passing between components
- Stores settings in Chrome Storage

### Options Page
- Standalone page for configuring API keys and system prompts
- Uses Chrome Storage API for persistence

## Limitations

- **Chrome Storage Quota**: ~10MB limit for chat history
- **XPATH Validation**: Chats require valid XPATH for restoration
- **No Backend**: All processing happens client-side
- **API Keys**: Stored locally in Chrome Storage (not synced)

## Troubleshooting

### Extension Not Loading
- Check `chrome://extensions/` for errors
- Ensure `manifest.json` is present in dist folder
- Try rebuilding: `npm run build`

### API Errors
- Verify API keys are correct in options page
- Check browser console for detailed error messages
- Ensure API keys have sufficient quota

### Chat Not Restoring
- Element must still exist in DOM with same XPATH
- Check console for validation errors
- Try clearing storage: Chrome DevTools > Application > Storage

## Development Tips

### Debugging

**Content Script:**
- Right-click page → Inspect → Console
- Check "Sources" tab for breakpoints

**Background Worker:**
- Go to `chrome://extensions/`
- Click "Service worker" link
- Opens DevTools for background worker

**Options Page:**
- Right-click options page → Inspect

### Hot Reload

The extension supports hot module replacement during development:
1. Keep `npm run dev` running
2. Make changes to source files
3. Reload extension in `chrome://extensions/`
4. Refresh the webpage (for content script changes)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

ISC

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI powered by [Chakra UI](https://chakra-ui.com/)
- Markdown rendering by [react-markdown](https://github.com/remarkjs/react-markdown)
- LLM APIs: [Anthropic](https://www.anthropic.com/) and [Google AI](https://ai.google/)
