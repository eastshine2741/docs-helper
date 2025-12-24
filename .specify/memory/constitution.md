<!--
Sync Impact Report - Constitution v1.0.0
Created: 2025-12-25

Version Change: [TEMPLATE] → 1.0.0 (initial constitution)

Principles Defined:
- I. Simplicity First (YAGNI)
- II. Beginner-Friendly State Management
- III. Chrome Extension Standards
- IV. Minimal Dependencies

Sections Added:
- Core Principles (4 principles)
- Technical Constraints
- Development Workflow
- Governance

Templates Requiring Updates:
- ✅ plan-template.md: Constitution Check section now validates against defined principles
- ✅ spec-template.md: Aligned with simplicity and no-testing requirements
- ✅ tasks-template.md: No test-related task categories required

Deferred Items:
- None

Follow-up TODOs:
- None
-->

# DocsHelper Constitution

## Core Principles

### I. Simplicity First (YAGNI)

**MUST** start with the simplest solution that works. **MUST NOT** add features, abstractions, or complexity for hypothetical future requirements.

**Rules:**
- Direct implementation over premature abstraction
- Three similar code blocks are better than one complex abstraction
- No helpers, utilities, or frameworks for one-time operations
- No feature flags, backwards-compatibility shims, or configuration for unused scenarios
- Delete unused code completely - no renaming to `_unused`, no `// removed` comments
- Only validate at system boundaries (user input, external APIs) - trust internal code

**Rationale:** The developer is new to frontend development. Simple, explicit code is easier to understand, debug, and maintain than clever abstractions. Complexity can be added later when patterns emerge from real usage.

### II. Beginner-Friendly State Management

**MUST** use easy-to-understand state management patterns suitable for developers new to React and frontend development.

**Rules:**
- Use React built-in hooks (`useState`, `useEffect`, `useContext`) - no external state libraries (Redux, MobX, Zustand)
- State changes **MUST** be explicit and traceable - use functional updates: `setState(prev => ...)`
- Component state **SHOULD** be co-located with the component using it - lift state only when sharing is necessary
- Chrome Storage operations **MUST** use type-safe wrapper (defined in `src/shared/utils/storage.ts`)
- Message passing **MUST** follow simple request-response pattern documented in contracts

**Rationale:** React's built-in state management is sufficient for this extension's scope. External libraries add learning curve, bundle size, and mental overhead without clear benefits. Type-safe wrappers prevent common Chrome API pitfalls.

### III. Chrome Extension Standards (NON-NEGOTIABLE)

**MUST** comply with Chrome Extension Manifest V3 requirements and best practices.

**Rules:**
- Manifest V3 compliance - no `eval()`, no remote code execution
- Content scripts **MUST** use Shadow DOM for style isolation
- API calls **MUST** happen in background service worker (not content script) to avoid CORS
- Storage **MUST** use `chrome.storage.local` API (not localStorage)
- Message passing **MUST** use `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`
- Content Security Policy (CSP) **MUST** be respected - no inline scripts, no unsafe-eval
- Extension **MUST NOT** modify host page DOM (overlay UI only)

**Rationale:** Manifest V3 is mandatory for Chrome Web Store. These constraints are non-negotiable technical requirements, not optional best practices.

### IV. Minimal Dependencies

**MUST** use only essential dependencies. Every dependency **MUST** be justified.

**Approved Dependencies:**
- **React 18+**: UI framework (core requirement)
- **TypeScript 5.x**: Type safety for beginner developer
- **Vite + @crxjs/vite-plugin**: Build tooling (Chrome extension optimized)
- **Chakra UI**: Complete UI component library (beginner-friendly, Shadow DOM compatible)
- **react-markdown**: Secure markdown rendering (renders to React elements, not HTML)
- **@anthropic-ai/sdk**: Claude API client (official SDK)
- **@google/generative-ai**: Gemini API client (official SDK)

**MUST NOT Add:**
- State management libraries (Redux, MobX, Zustand) - use React built-ins
- Testing frameworks - tests explicitly not required
- CSS frameworks beyond Chakra UI (no Tailwind, no Bootstrap)
- Additional markdown parsers (stick to react-markdown)
- Alternative HTTP clients (use built-in `fetch`)

**Rationale:** Each dependency adds bundle size, security surface, and complexity. The approved list covers all requirements without redundancy. Smaller bundle = faster load = better UX.

## Technical Constraints

### Chrome Extension Architecture

**MUST** follow this structure:
```
src/
├── content/       # Content scripts (injected into pages)
├── background/    # Background service worker (API calls)
├── options/       # Options page (settings UI)
└── shared/        # Shared types, utils, constants
```

**File Organization:**
- Types **MUST** live in `src/shared/types/`
- Utilities **MUST** live in `src/shared/utils/`
- Constants **MUST** live in `src/shared/constants/`
- Components **MUST** be co-located with their styles and tests (when added later)

### Performance Standards

- Text selection → button appearance: <200ms (FR-001)
- Chat room operations: <500ms UI responsiveness (SC-003)
- Chat room restoration: <2 seconds on page load (SC-007)
- Support 10+ concurrent chat rooms without degradation (SC-003)

### Security Requirements

- API keys **MUST** be stored in Chrome Storage (never in code)
- Markdown rendering **MUST** use `react-markdown` (outputs React elements, not HTML strings)
- No `dangerouslySetInnerHTML` - ever
- User input **MUST** be validated before sending to LLM APIs
- Storage quota **MUST** be checked before persisting data

## Development Workflow

### Code Style

- **TypeScript strict mode**: enabled
- **Functional components**: required (no class components)
- **Explicit types**: required for function parameters and return values
- **File naming**: camelCase for files, PascalCase for components
- **Imports**: absolute paths from `src/` (configured in tsconfig)

### Implementation Order

**MUST** follow this sequence:
1. **Setup** (T001-T014): Project initialization, dependencies, configuration
2. **Foundational** (T015-T029): Types, utilities, services - **BLOCKS all user stories**
3. **User Stories** (T030-T088): Implement by priority (P1 → P2 → P3 → P4)
4. **Polish** (T089-T100): Documentation, cleanup, validation

**Rationale:** Foundational types and services must exist before any UI work. User stories are independent and can proceed in priority order.

### No Testing Requirement

Tests are **explicitly not required** for this project. Focus on:
- Clear, self-documenting code
- Type safety via TypeScript
- Manual testing during development
- User acceptance testing

**Rationale:** Per user requirement: "Test is not needed." Developer is learning frontend; tests add cognitive overhead without value at this stage.

### State Management Patterns

**Component State (Simple):**
```typescript
const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

// Functional update (always)
setChatRooms(prev => [...prev, newRoom]);
```

**Shared State (Context):**
```typescript
// Only when multiple components need the same state
const ChatRoomsContext = createContext<ChatRoomsContextType>(null!);
```

**Persistent State (Chrome Storage):**
```typescript
// Use type-safe wrapper
await storage.set('chatRooms', chatRooms);
const saved = await storage.get('chatRooms');
```

### Error Handling

- User-facing errors **MUST** show friendly messages (no stack traces)
- API errors **MUST** preserve chat room and allow retry
- Storage quota errors **MUST** guide user to delete old rooms
- Missing API keys **MUST** show error and discard unsaved chat room

## Governance

### Amendment Process

1. Constitution changes **MUST** be documented with rationale
2. Version **MUST** increment according to semantic versioning:
   - **MAJOR**: Backward-incompatible principle changes (e.g., requiring tests)
   - **MINOR**: New principle added or expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic updates
3. Templates **MUST** be updated to reflect new principles
4. Amendments require updating this Sync Impact Report

### Compliance

- All implementation **MUST** verify compliance with Core Principles
- Complexity **MUST** be justified against Principle I (Simplicity First)
- Dependency additions **MUST** be justified against Principle IV (Minimal Dependencies)
- Chrome extension violations are automatic blockers (Principle III is non-negotiable)

### Conflict Resolution

If principles conflict:
1. **Chrome Extension Standards (III)** overrides all others (technical requirement)
2. **Simplicity First (I)** breaks ties between equally valid approaches
3. Document the conflict and resolution in git commit message

### Living Document

This constitution is a living document. As the project evolves and the developer gains experience:
- Principles can be amended through the formal process
- "Simple" may mean different things as patterns emerge
- Testing may be added later if value becomes clear

**Version**: 1.0.0 | **Ratified**: 2025-12-25 | **Last Amended**: 2025-12-25
