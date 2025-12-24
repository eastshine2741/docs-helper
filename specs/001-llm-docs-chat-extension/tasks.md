# Tasks: DocsHelper - LLM-Powered Documentation Assistant

**Input**: Design documents from `/specs/001-llm-docs-chat-extension/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested - no test tasks included

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Chrome extension structure

- [X] T001 Initialize Node.js project with package.json and TypeScript configuration
- [X] T002 Install core dependencies: react, react-dom, typescript, vite, @crxjs/vite-plugin
- [X] T003 [P] Install UI dependencies: @chakra-ui/react, @emotion/react, @emotion/styled, framer-motion
- [X] T004 [P] Install markdown dependencies: react-markdown, react-syntax-highlighter, @types/react-syntax-highlighter
- [X] T005 [P] Install LLM SDK dependencies: @anthropic-ai/sdk, @google/generative-ai
- [X] T006 [P] Install dev dependencies: @types/chrome
- [X] T007 Configure vite.config.ts for Chrome extension with @crxjs/vite-plugin and multiple entry points
- [X] T009 Configure tsconfig.json for TypeScript 5.x with React JSX support
- [X] T010 Create manifest.json for Chrome Extension Manifest V3 with content_scripts, background, and options_page
- [X] T011 Create project directory structure: src/{content,options,background,shared}, public/
- [X] T012 [P] Add extension icons to public/icons/ (16x16, 48x48, 128x128)
- [X] T013 [P] Create .gitignore for node_modules, dist, and IDE files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types, utilities, and services that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T015 [P] Define ChatRoom type in src/shared/types/chatRoom.ts
- [X] T016 [P] Define Message type in src/shared/types/message.ts
- [X] T017 [P] Define TextSelection type in src/shared/types/textSelection.ts
- [X] T018 [P] Define LLMModel type and constants in src/shared/types/llmModel.ts
- [X] T019 [P] Define UserSettings type in src/shared/types/userSettings.ts
- [X] T020 [P] Define message passing types in src/shared/types/messaging.ts
- [X] T021 [P] Create LLM provider constants in src/shared/constants/llmProviders.ts
- [X] T022 Implement type-safe Chrome Storage wrapper in src/shared/utils/storage.ts
- [X] T023 [P] Implement XPATH calculation utilities in src/shared/utils/xpath.ts
- [X] T024 Create background service worker entry point in src/background/index.ts
- [X] T025 Implement message handler routing in src/background/messageHandler.ts
- [X] T026 [P] Implement Claude LLM service in src/background/services/claudeService.ts
- [X] T027 [P] Implement Gemini LLM service in src/background/services/geminiService.ts
- [X] T028 Implement LLM factory in src/background/services/llmFactory.ts
- [X] T029 Implement API request handler in src/background/api.ts for message passing

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Quick Documentation Clarification (Priority: P1) 🎯 MVP

**Goal**: Enable users to select text, start a chat, send a message, and receive an LLM response

**Independent Test**: Select text on any webpage → Start chat → Select LLM model → Send message → Receive markdown-formatted response → Verify chat position maintained on scroll → Test error when no API keys configured

### Implementation for User Story 1

- [ ] T030 [P] [US1] Implement text selection detection service in src/content/services/selectionManager.ts
- [ ] T031 [P] [US1] Create StartChatButton component in src/content/components/StartChatButton/index.tsx
- [ ] T032 [P] [US1] Create TextHighlight component in src/content/components/TextHighlight/index.tsx
- [ ] T033 [US1] Implement useTextSelection hook in src/content/hooks/useTextSelection.ts
- [ ] T034 [P] [US1] Create ChatRoom component shell in src/content/components/ChatRoom/index.tsx
- [ ] T035 [P] [US1] Create MessageList component with markdown rendering in src/content/components/MessageList/index.tsx
- [ ] T036 [US1] Implement LLM model dropdown in ChatRoom component
- [ ] T037 [US1] Implement message input and send functionality in ChatRoom component
- [ ] T038 [US1] Implement chat room positioning logic (fixed 400px width, right edge, viewport-relative)
- [ ] T039 [US1] Implement scroll position maintenance in ChatRoom component
- [ ] T040 [US1] Implement useLLMRequest hook in src/content/hooks/useLLMRequest.ts for API communication
- [ ] T041 [US1] Implement streaming response handling in MessageList component
- [ ] T042 [US1] Implement API key validation with error display and chat room discard logic
- [ ] T043 [US1] Create content script entry point in src/content/index.tsx with Shadow DOM setup
- [ ] T044 [US1] Integrate ChakraProvider and inject styles into Shadow DOM
- [ ] T045 [US1] Wire up text selection → button display → chat creation flow
- [ ] T046 [US1] Add error handling for missing API keys with user-friendly messages

**Checkpoint**: User Story 1 is fully functional - users can select text, chat with LLM, and see responses

---

## Phase 4: User Story 2 - Multiple Concurrent Conversations (Priority: P2)

**Goal**: Enable users to manage multiple chat rooms on the same page without interference

**Independent Test**: Create multiple chat rooms for different selections → Verify stacking (newest at bottom) → Test expand/collapse (only one expanded) → Verify concurrent API requests work independently → Test collapse during streaming

### Implementation for User Story 2

- [ ] T047 [US2] Implement chat room manager service in src/content/services/chatRoomManager.ts
- [ ] T048 [US2] Implement useChatRooms hook in src/content/hooks/useChatRooms.ts for managing multiple rooms
- [ ] T049 [US2] Implement vertical stacking logic (newest at bottom, older rooms pushed up)
- [ ] T050 [US2] Implement expanded/collapsed state management (ChatRoom type has state field)
- [ ] T051 [US2] Implement "only one expanded" constraint in chat room manager
- [ ] T052 [US2] Implement click outside handler to collapse expanded chat room
- [ ] T053 [US2] Implement click on collapsed room to expand (and collapse others)
- [ ] T054 [US2] Update MessageList to show only first and last message with "..." when collapsed
- [ ] T055 [US2] Implement chat room identifier generation (XPATH + model + text indices)
- [ ] T056 [US2] Implement duplicate chat room check before creation
- [ ] T057 [US2] Ensure concurrent API requests don't block each other (independent message handlers)
- [ ] T058 [US2] Ensure API request continues when chat room is collapsed (background continues)
- [ ] T059 [US2] Update ChatRoom component with expand/collapse visual states
- [ ] T060 [US2] Implement highlight intensity differentiation (strong for expanded, light for collapsed)

**Checkpoint**: User Story 2 is functional - users can manage multiple concurrent conversations independently

---

## Phase 5: User Story 3 - Persistent Conversation History (Priority: P3)

**Goal**: Save chat rooms to storage and restore them across browser sessions

**Independent Test**: Create chat rooms with messages → Close browser → Reopen page → Verify all chat rooms restored → Test delete with confirmation → Verify duplicate prevention works

### Implementation for User Story 3

- [ ] T061 [US3] Implement storage service in src/content/services/storageService.ts using shared storage utils
- [ ] T062 [US3] Implement chat room persistence logic (save after first complete message exchange)
- [ ] T063 [US3] Implement chat room restoration on page load in content script entry point
- [ ] T064 [US3] Implement XPATH validation during restoration (verify element still exists in DOM)
- [ ] T065 [US3] Implement cleanup of invalid chat rooms (XPATH no longer exists)
- [ ] T066 [US3] Add delete button to ChatRoom component header
- [ ] T067 [US3] Implement confirmation dialog for chat room deletion
- [ ] T068 [US3] Implement chat room removal from storage and UI on confirmed deletion
- [ ] T069 [US3] Implement duplicate chat room prevention using identifier matching
- [ ] T070 [US3] Implement loading existing chat room instead of creating duplicate
- [ ] T071 [US3] Implement storage quota detection in storageService
- [ ] T072 [US3] Implement error message display when storage quota exceeded
- [ ] T073 [US3] Implement failed message status tracking for interrupted API requests
- [ ] T074 [US3] Implement retry button display for failed messages
- [ ] T075 [US3] Implement manual retry functionality for failed messages

**Checkpoint**: User Story 3 is functional - chat rooms persist across sessions and can be managed

---

## Phase 6: User Story 4 - Personalized Responses (Priority: P4)

**Goal**: Allow users to configure API keys and custom system prompts via options page

**Independent Test**: Open options page → Enter API keys in plain text fields → Set custom system prompt → Save → Verify persistence → Verify LLM requests include custom prompt → Revisit options → Verify values displayed

### Implementation for User Story 4

- [ ] T076 [P] [US4] Create options page HTML in src/options/index.html
- [ ] T077 [P] [US4] Create ApiKeySettings component in src/options/components/ApiKeySettings/index.tsx
- [ ] T078 [P] [US4] Create PromptSettings component in src/options/components/PromptSettings/index.tsx
- [ ] T079 [US4] Implement options page entry point in src/options/index.tsx
- [ ] T080 [US4] Implement API key input fields (plain text) for Claude and Gemini
- [ ] T081 [US4] Implement system prompt textarea input
- [ ] T082 [US4] Implement save button with Chrome Storage persistence
- [ ] T083 [US4] Implement settings loading on options page mount
- [ ] T084 [US4] Implement API key format validation (Claude starts with 'sk-ant-')
- [ ] T085 [US4] Update background API handler to include systemPrompt in LLM requests
- [ ] T086 [US4] Implement default system prompt: "You are a helpful assistant explaining documentation. Be concise and clear."
- [ ] T087 [US4] Add ChakraProvider to options page for consistent UI
- [ ] T088 [US4] Implement save success feedback (toast or message)

**Checkpoint**: User Story 4 is functional - users can configure and personalize their LLM interactions

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T089 [P] Add inline documentation comments to complex functions
- [ ] T090 [P] Implement error boundary components for React error handling
- [ ] T091 [P] Add loading states for all async operations
- [ ] T092 [P] Implement optimistic UI updates where appropriate
- [ ] T093 Code cleanup: Remove console.logs, fix linting errors
- [ ] T094 [P] Add package.json scripts: dev, build, type-check, lint
- [ ] T095 [P] Create README.md with installation and development instructions
- [ ] T096 Verify all 41 functional requirements are implemented
- [ ] T100 Verify all success criteria (SC-001 through SC-008) are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - no dependencies on other stories
- **User Story 2 (P2)**: Foundational only - builds on US1 components but independently testable
- **User Story 3 (P3)**: Foundational only - adds persistence to US1/US2 but independently testable
- **User Story 4 (P4)**: Foundational only - adds configuration to US1-US3 but independently testable

### Within Each User Story

- Components marked [P] can run in parallel
- Hooks depend on services being available
- Integration tasks depend on component completion
- Each story should be independently completable

### Parallel Opportunities

**Setup Phase (Phase 1):**
- T003, T004, T005, T006 (dependency installation)
- T012, T013 (static assets and config)

**Foundational Phase (Phase 2):**
- T015-T021 (all type definitions)
- T022, T023 (utility functions)
- T026, T027 (LLM services - different files)

**User Story 1:**
- T030, T031, T032 (selection manager, button, highlight)
- T034, T035 (ChatRoom shell and MessageList)

**User Story 2:**
- Tasks are sequential due to state management dependencies

**User Story 3:**
- T066, T067, T068 (delete UI components can be parallel)
- T073, T074, T075 (retry functionality can be parallel)

**User Story 4:**
- T076, T077, T078 (HTML and components)

**Polish Phase:**
- T089, T090, T091, T092, T094, T095 (documentation and improvements)

---

## Parallel Example: Foundational Phase

```bash
# Launch all type definitions together:
Task: "Define ChatRoom type in src/shared/types/chatRoom.ts"
Task: "Define Message type in src/shared/types/message.ts"
Task: "Define TextSelection type in src/shared/types/textSelection.ts"
Task: "Define LLMModel type in src/shared/types/llmModel.ts"
Task: "Define UserSettings type in src/shared/types/userSettings.ts"
Task: "Define message passing types in src/shared/types/messaging.ts"

# Launch both LLM service implementations together:
Task: "Implement Claude LLM service in src/background/services/claudeService.ts"
Task: "Implement Gemini LLM service in src/background/services/geminiService.ts"
```

## Parallel Example: User Story 1

```bash
# Launch core components together:
Task: "Implement text selection detection in src/content/services/selectionManager.ts"
Task: "Create StartChatButton component in src/content/components/StartChatButton/index.tsx"
Task: "Create TextHighlight component in src/content/components/TextHighlight/index.tsx"

# Launch chat UI components together:
Task: "Create ChatRoom component shell in src/content/components/ChatRoom/index.tsx"
Task: "Create MessageList component in src/content/components/MessageList/index.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013)
2. Complete Phase 2: Foundational (T015-T029) ← CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T030-T046)
4. **STOP and VALIDATE**:
   - Load extension in Chrome
   - Select text on a documentation page
   - Click "start chat" button
   - Select LLM model
   - Send a message
   - Verify response appears with markdown
   - Test scroll position maintenance
   - Test error when no API keys configured
5. **MVP is COMPLETE** - Extension delivers core value

### Incremental Delivery

1. **Foundation** (Setup + Foundational) → Extension structure ready
2. **+ User Story 1** → Test independently → **MVP READY** for demo/use
3. **+ User Story 2** → Test multi-room scenarios → Enhanced version ready
4. **+ User Story 3** → Test persistence → Production-grade ready
5. **+ User Story 4** → Test customization → Full-featured ready
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Everyone**: Complete Setup + Foundational together (T001-T029)
2. **Once Foundational is done:**
   - Developer A: User Story 1 (T030-T046)
   - Developer B: User Story 2 (T047-T060)
   - Developer C: User Story 3 (T061-T075)
   - Developer D: User Story 4 (T076-T088)
3. Stories complete and integrate independently
4. **Team**: Polish phase together (T089-T100)

---

## Task Count Summary

- **Setup**: 14 tasks
- **Foundational**: 15 tasks (BLOCKS all stories)
- **User Story 1 (P1 - MVP)**: 17 tasks
- **User Story 2 (P2)**: 14 tasks
- **User Story 3 (P3)**: 15 tasks
- **User Story 4 (P4)**: 13 tasks
- **Polish**: 12 tasks

**Total**: 100 tasks

**Parallel Opportunities**: 29 tasks marked [P] can run in parallel

---

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Suggested MVP scope**: Setup + Foundational + User Story 1 (46 tasks total)
- Extension is fully functional and usable after User Story 1
- User Stories 2-4 are enhancements that add power-user and persistence features
