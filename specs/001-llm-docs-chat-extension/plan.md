# Implementation Plan: DocsHelper - LLM-Powered Documentation Assistant

**Branch**: `001-llm-docs-chat-extension` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-llm-docs-chat-extension/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

DocsHelper is a Chrome extension that enables users to have contextual LLM conversations about selected documentation text. Users select text on any webpage, start a chat room anchored to that selection, and interact with Claude or Gemini to clarify understanding. The extension supports multiple concurrent conversations, persists chat history across sessions, and provides a collapsible UI that doesn't interfere with the host page layout.

## Technical Context

**Language/Version**: TypeScript 5.x with React 18+
**Primary Dependencies**:
  - React 18+ (UI framework)
  - Vite (build tool optimized for Chrome extensions)
  - Chrome Extension Manifest V3 APIs
  - Charkra UI, shardcn/ui(optional)
  - react-markdown vs marked
  - LLM API clients for Claude (Anthropic SDK) and Gemini (Google AI SDK)

**Storage**: Chrome Storage API (chrome.storage.local for persistence)

**Testing**: Not needed

**Target Platform**: Chrome browser (version 90+), Chrome Extension Manifest V3

**Project Type**: Chrome Extension (content script + options page + background service worker)

**Performance Goals**:
  - UI responsiveness <500ms for chat room operations
  - Text selection to button appearance <200ms
  - Chat room restoration <2 seconds on page load
  - Support 10+ concurrent chat rooms without degradation

**Constraints**:
  - Manifest V3 compliance (no eval, CSP restrictions)
  - No backend server (direct LLM API calls from extension)
  - Cannot modify host page DOM (overlay UI only)
  - Chrome storage quota limits (~10MB typical)
  - Must handle CSP of various documentation sites

**Scale/Scope**:
  - Single-user Chrome extension
  - ~10-20 UI components (chat room, options page, markdown renderer)
  - 2 LLM provider integrations (Claude, Gemini)
  - Content script injection on all web pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: N/A - Constitution file contains template placeholders only. No project-specific principles defined yet.

**Note**: The constitution file at `.specify/memory/constitution.md` is currently a template. Once project principles are established (e.g., via `/speckit.constitution`), this section will validate the implementation plan against those principles.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── content/                    # Content script injected into web pages
│   ├── components/             # React components for chat UI
│   │   ├── ChatRoom/          # Chat room component (expanded/collapsed states)
│   │   ├── MessageList/       # Message display with markdown
│   │   ├── TextHighlight/     # Highlight overlay for selected text
│   │   └── StartChatButton/   # Floating button on text selection
│   ├── services/              # Business logic for content script
│   │   ├── selectionManager.ts    # Text selection and XPATH calculation
│   │   ├── chatRoomManager.ts     # Chat room state and positioning
│   │   ├── storageService.ts      # Chrome storage operations
│   │   └── llmService.ts          # LLM API integration
│   ├── hooks/                 # React hooks for state management
│   │   ├── useChatRooms.ts
│   │   ├── useTextSelection.ts
│   │   └── useLLMRequest.ts
│   └── index.tsx              # Content script entry point
│
├── options/                    # Options page
│   ├── components/
│   │   ├── ApiKeySettings/
│   │   └── PromptSettings/
│   └── index.tsx
│
├── background/                 # Background service worker (if needed)
│   └── index.ts
│
├── shared/                     # Shared types and utilities
│   ├── types/                 # TypeScript types
│   │   ├── chatRoom.ts
│   │   ├── message.ts
│   │   ├── textSelection.ts
│   │   └── llmModel.ts
│   ├── constants/
│   │   └── llmProviders.ts
│   └── utils/
│       ├── xpath.ts
│       └── markdown.ts
│
└── manifest.json              # Chrome extension manifest V3

public/
├── icons/                     # Extension icons
└── styles/                    # Global styles if needed

tests/
├── unit/                      # Unit tests for services and utilities
├── integration/               # Integration tests for Chrome APIs
└── e2e/                       # End-to-end tests (if applicable)
```

**Structure Decision**: Chrome Extension architecture with React-based content script. The extension follows a component-based structure where:
- `content/` contains the main UI injected into web pages
- `options/` provides the settings interface
- `background/` handles service worker logic (minimal - primarily for API calls if needed for CORS)
- `shared/` contains TypeScript types and utilities used across contexts
- All code is TypeScript with React for UI components
- Vite bundler configured for Chrome extension build with separate entry points

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
