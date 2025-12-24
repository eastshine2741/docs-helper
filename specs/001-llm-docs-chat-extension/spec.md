# Feature Specification: DocsHelper - LLM-Powered Documentation Assistant

**Feature Branch**: `001-llm-docs-chat-extension`
**Created**: 2025-12-24
**Status**: Draft
**Input**: User description: "# DocsHelper: A Chrome extension for reading docs using LLMs
## Spec
### Main Flow
- When user select a certain range of text in a web page, the text get highlighted and a hovering button('start chat' button) appears at the right-most bottom of the selected text.
- When user clicks the 'start chat' button, a chat room appears.
    - Vertical location: same vertical location with the rightmost bottom of the selected text
    - Horizontal location: the rightmost side of the page. the page should not be expanded horizontally by the chat room.
    - Although multiple chat room exists on the same vertical location, each chat room must not be overlapped. The latest-created chat room keeps its original vertical location, and other older created chat rooms are stacked upon the latest chat room. Therefore, the lower you go, the more recently created it is. Chat rooms are identified by composition of some values, as specified below.
    - A chat room should keep its vertical location even if the web page gets scrolled.
    - If a chat room already exists by the identifier below, already existing messages should be loaded, not creating duplicated chat room.
    - Chat room UI should support markdown format.
- User can ask to a LLM in the chat room.
    - User can select LLM using dropdown in the chat room, only before starting any chat. After starting chat, the dropdown gets inactive and its content is fixed as current chat.
    - Regarding available models and api key, refer to 'Option page' section below.
    - A chat room is identified by composition of those: XPATH, model, inclusive start index of selected text(if any), inclusive end index of selected text(if any)
        - If the selected range spans multiple HTML tags, use the XPATH of the nearest common ancestor HTML tag. Therefore start and end index of selected text are optional.
    - A chat room has expanded/collapsed state.
        - On expanded state, all messages in the chat room are shown, starting from recent message. An input box for new message appears bottom of the chat room.
        - On collapsed state, only the oldest message and the latest message are shown. All messages between them are not shown, replaced by '...'.
        - At most one chat room can be expanded at same time.
        - On expanded state, the chat room transits into collapsed state when user clicks outside of chat room.
        - On collapsed state, the chat room transits into expanded state when user clicks collapsed chat room.
- Any chat room with more than one messages are persisted in the storage.
    - When user visited the web page again, all chat rooms must be shown.
    - Chat room has delete button on its top. If user clicks the delete button, a confirm alert appears, and deletes the chat room from storage on confirmed.
- Each chat room's selected range should be highlighted in the web page.
    - If chat room has only XPATH(i.e. its selected range spans on multiple HTML tags), the tag of the XPATH should be highlighted.
    - If chat room has XPATH and start/end indices, only the text should be highlighted.
    - Highlighted level differs as per the chat room's state. If chat room is expanded state, highlight gets stronger, compared to collapsed state.
- LLM API requests should be independent between multiple chat rooms.
    - That is, there can be multiple chat rooms with API request ongoing.
- LLM API request should be continued even if the chat room transits into collapsed state.
    - New request is only available on expanded state. But already ongoing request should not be disrupted by state transition.

### Option page
- User can put his API key using input box.
- User can put his prompt about answer tone, personal preference, etc.
    - Any LLM request should contain the prompt.
- Any input should be persisted on save button clicked.

### LLM
- Currently supports claude, gemini.
- Should send entire preceding messages in the chat room, both by user and agent, on new request."

## Clarifications

### Session 2025-12-24

- Q: How should the system handle a chat room with only a user's unsent draft message or when no API keys are configured? → A: Show error message, and discard chat room with only a user's unsent draft message
- Q: How should the system handle in-progress API requests when the browser/tab is closed? → A: Save user message with "failed" status; require user to manually retry by clicking retry button
- Q: What should happen when a chat room's message history grows very large? → A: No limit; allow unlimited messages until storage quota is exceeded, then fail with error
- Q: How wide should chat rooms be? → A: Fixed 400px width for all chat rooms; no customization
- Q: How should API keys be displayed and handled in the options page? → A: Display API keys in plain text; allow editing directly

## User Scenarios & Testing

### User Story 1 - Quick Documentation Clarification (Priority: P1)

A developer reading API documentation selects a confusing paragraph about authentication and starts a chat to ask for clarification. The LLM explains the selected text in simpler terms.

**Why this priority**: This is the core value proposition - enabling users to get instant help understanding documentation without leaving the page.

**Independent Test**: Can be fully tested by selecting text on any webpage, starting a chat, sending a message, and receiving a response. Delivers immediate value without any persistence or advanced features.

**Acceptance Scenarios**:

1. **Given** user is on a documentation webpage, **When** they select a text range, **Then** the text is highlighted and a "start chat" button appears at the bottom-right of the selection
2. **Given** the "start chat" button is visible, **When** user clicks it, **Then** a chat interface appears pinned to the right side of the page at the same vertical position as the selection
3. **Given** the chat interface is open and no messages exist yet, **When** user selects an LLM from the dropdown and types a question, **Then** the message is sent to the LLM and a response appears with markdown formatting
4. **Given** a chat is in progress, **When** user scrolls the page, **Then** the chat interface maintains its vertical position relative to the viewport
5. **Given** user has not configured API keys, **When** they attempt to send their first message in a chat room, **Then** an error message is displayed and the chat room is discarded

---

### User Story 2 - Multiple Concurrent Conversations (Priority: P2)

A developer is reading a complex tutorial with multiple sections. They create separate chat rooms for different code examples to ask specific questions about each, managing multiple conversations simultaneously.

**Why this priority**: Enables power users to work efficiently with complex documentation by maintaining context for different topics separately.

**Independent Test**: Can be tested by creating multiple chat rooms for different text selections on the same page, verifying they stack properly and can be interacted with independently.

**Acceptance Scenarios**:

1. **Given** a chat room already exists on the page, **When** user creates a new chat room at the same vertical position, **Then** the new chat room appears at its original position and older chat rooms are stacked above it
2. **Given** multiple chat rooms exist, **When** user clicks on a collapsed chat room, **Then** it expands and any previously expanded chat room collapses
3. **Given** multiple chat rooms are sending API requests, **When** responses arrive, **Then** each chat room displays its own response independently without interference
4. **Given** a chat room is receiving a streaming response, **When** user collapses the chat room, **Then** the API request continues and the response is still received in the background

---

### User Story 3 - Persistent Conversation History (Priority: P3)

A developer returns to a documentation page they visited yesterday and sees their previous chat conversations with highlighted sections still available, allowing them to continue from where they left off.

**Why this priority**: Improves long-term productivity by allowing users to build up a knowledge base over multiple sessions.

**Independent Test**: Can be tested by creating chat rooms with messages, closing the browser, revisiting the page, and verifying all chat rooms and messages are restored.

**Acceptance Scenarios**:

1. **Given** user has created chat rooms with messages on a page, **When** they revisit the same page later, **Then** all chat rooms are restored with their full conversation history
2. **Given** a persisted chat room exists, **When** user clicks the delete button and confirms, **Then** the chat room is removed from the page and from storage
3. **Given** a chat room identifier (XPATH + model + text indices) already exists in storage, **When** user tries to create a new chat room with the same identifier, **Then** the existing chat room is loaded instead of creating a duplicate

---

### User Story 4 - Personalized Responses (Priority: P4)

A user configures their preferred communication style (e.g., "explain like I'm a beginner" or "focus on security implications") in the options page, and all subsequent LLM responses follow this preference.

**Why this priority**: Enhances user experience by customizing responses to individual needs, but the extension is fully functional without it.

**Independent Test**: Can be tested by setting a custom prompt in options, saving it, and verifying that all new LLM requests include this prompt.

**Acceptance Scenarios**:

1. **Given** user is on the extension options page, **When** they enter their API keys for Claude and Gemini in plain text input fields and click save, **Then** the API keys are persisted in storage
2. **Given** user has previously saved API keys, **When** they revisit the options page, **Then** the API keys are displayed in plain text, allowing them to view and edit directly
3. **Given** user has set a custom system prompt in options, **When** they send a message in any chat room, **Then** the LLM request includes the custom prompt
4. **Given** user has configured options, **When** they revisit the options page, **Then** all previously saved values are displayed in the input fields

---

### Edge Cases

- What happens when user selects text that spans multiple HTML elements with complex nesting (e.g., across lists, tables, code blocks)?
- How does the system handle chat rooms when the DOM structure of the page changes dynamically (single-page applications)?
- What happens when multiple chat rooms stack beyond the visible viewport height?
- When chat room message history grows very large: No automatic limit enforced; messages accumulate until Chrome storage quota (~10MB) is exceeded
- When Chrome storage quota is exceeded: System displays error message to user indicating storage is full and they need to delete old chat rooms; new messages cannot be saved until space is freed
- When API keys are not configured: System displays error message when user attempts to send first message, then discards the chat room and any unsent draft
- When API requests fail due to invalid keys or network errors: System displays error message within the chat room, but preserves the chat room and message history
- When browser/tab is closed during API request: System saves user message with "failed" status; displays retry button when user returns to page
- How does the system handle race conditions when user rapidly creates/collapses multiple chat rooms?
- What happens when user selects text in an iframe or shadow DOM?
- How does the extension handle pages with extreme CSS styling or z-index conflicts?

## Requirements

### Functional Requirements

- **FR-001**: System MUST display a "start chat" button at the bottom-right of any user-selected text range within 200ms of selection completion
- **FR-002**: System MUST highlight selected text ranges with visual indicators that persist until the associated chat room is deleted
- **FR-003**: System MUST create a unique identifier for each chat room based on XPATH, LLM model, and text selection indices (if text within single element)
- **FR-004**: System MUST position chat rooms at the right edge of the viewport without causing horizontal scrolling
- **FR-005**: System MUST render all chat rooms with a fixed width of 400px
- **FR-006**: System MUST stack multiple chat rooms vertically when they occupy the same vertical position, with newest at the bottom
- **FR-007**: System MUST maintain chat room vertical position relative to viewport during page scrolling
- **FR-008**: System MUST support markdown formatting in chat message display including code blocks, lists, links, and emphasis
- **FR-009**: System MUST allow LLM model selection via dropdown before first message is sent in a chat room
- **FR-010**: System MUST disable LLM model dropdown after first message is sent in a chat room
- **FR-011**: System MUST support at least two LLM providers: Claude (Anthropic) and Gemini (Google)
- **FR-012**: System MUST send full conversation history (user and assistant messages) with each new LLM API request
- **FR-013**: System MUST persist chat rooms with one or more messages to browser storage
- **FR-014**: System MUST restore all persisted chat rooms when user revisits a previously visited page
- **FR-015**: System MUST prevent duplicate chat rooms by checking identifier uniqueness before creation
- **FR-016**: System MUST support two chat room states: expanded (showing all messages) and collapsed (showing first and last message with "..." between)
- **FR-017**: System MUST ensure only one chat room is expanded at any time
- **FR-018**: System MUST collapse expanded chat room when user clicks outside the chat interface
- **FR-019**: System MUST expand collapsed chat room when user clicks on it
- **FR-020**: System MUST display delete button on each chat room interface
- **FR-021**: System MUST show confirmation dialog before deleting a chat room
- **FR-022**: System MUST remove chat room from storage and page when deletion is confirmed
- **FR-023**: System MUST differentiate highlight intensity based on chat room state (stronger for expanded, lighter for collapsed)
- **FR-024**: System MUST support concurrent API requests across multiple chat rooms without blocking
- **FR-025**: System MUST continue processing API requests even when associated chat room is collapsed
- **FR-026**: System MUST provide options page for users to configure API keys for supported LLM providers
- **FR-027**: System MUST display API keys in plain text input fields on options page, allowing direct viewing and editing
- **FR-028**: System MUST provide options page for users to configure custom system prompt preferences
- **FR-029**: System MUST include user-configured system prompt in all LLM API requests
- **FR-030**: System MUST persist all options page settings when user clicks save button
- **FR-031**: System MUST validate API key configuration before allowing user to send first message; display error message and discard chat room if no API key is configured for selected model
- **FR-032**: System MUST NOT persist chat rooms with only unsent(existing only in input box) draft messages (only persist after at least one user message created)
- **FR-033**: System MUST save user messages with "failed" status when API request is interrupted by browser/tab closure
- **FR-034**: System MUST display retry button for messages with "failed" status when chat room is reopened
- **FR-035**: System MUST allow user to manually retry failed messages by clicking retry button
- **FR-036**: System MUST NOT impose limit on number of messages per chat room
- **FR-037**: System MUST detect when Chrome storage quota is exceeded during save operations
- **FR-038**: System MUST display error message to user when storage quota is exceeded, indicating they need to delete old chat rooms
- **FR-039**: System MUST calculate XPATH to nearest common ancestor when text selection spans multiple HTML elements
- **FR-040**: System MUST highlight entire element when chat room is identified by XPATH only (multi-element selection)
- **FR-041**: System MUST highlight only selected text range when chat room has both XPATH and text indices

### Key Entities

- **ChatRoom**: Represents a conversation anchored to a specific text selection on a webpage
  - Identified by: XPATH, LLM model, optional text start/end indices
  - Contains: message history, expanded/collapsed state, creation timestamp
  - Related to: TextSelection, LLMModel

- **TextSelection**: Represents a range of text selected by the user
  - Contains: XPATH of element or common ancestor, optional character start/end indices, page URL
  - Related to: ChatRoom

- **Message**: Represents a single message in a conversation
  - Contains: content text, role (user/assistant), timestamp, markdown formatted content, status (sent/success/failed for user messages)
  - Related to: ChatRoom

- **LLMModel**: Represents an available language model provider
  - Contains: provider name (Claude/Gemini), model identifier, API endpoint configuration
  - Related to: ChatRoom, UserSettings

- **UserSettings**: Represents user configuration
  - Contains: API keys per provider, custom system prompt, saved timestamp
  - Related to: LLMModel

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a chat room and receive their first LLM response within 5 seconds of text selection (excluding API response time)
- **SC-002**: System correctly positions and maintains chat rooms without overlapping or causing page layout shifts in 95% of common documentation websites
- **SC-003**: Users can manage up to 10 concurrent chat rooms on a single page without performance degradation (measured by UI responsiveness under 500ms)
- **SC-004**: Chat room persistence works reliably across browser sessions with 99% data retention accuracy
- **SC-005**: Users successfully complete the setup process (API key configuration) within 2 minutes on first use
- **SC-006**: Markdown rendering displays correctly for 95% of common markdown syntax patterns
- **SC-007**: Chat rooms restore within 2 seconds when revisiting a previously visited page with saved conversations
- **SC-008**: System handles text selections across complex DOM structures (tables, nested lists, code blocks) without errors in 90% of cases

## Assumptions

- Users have valid API keys for at least one supported LLM provider (Claude or Gemini)
- Documentation pages follow standard HTML structure (the extension may have limited functionality on pages with non-standard DOM manipulation)
- Users have modern Chrome browser (version 90+)
- API requests are subject to provider rate limits and costs managed by the user
- Text selections are made using standard browser selection mechanisms
- Pages do not have extreme z-index conflicts (assume reasonable z-index values for overlay positioning)
- Users will manage storage manually by deleting old chat rooms when Chrome storage quota (~10MB) is approached
- Users understand that different LLM models may provide different response qualities and costs
- Chat room identifiers remain stable (page DOM structure doesn't change drastically between visits for the same content)

## Constraints

- Extension must work within Chrome Extension Manifest V3 requirements
- Cannot modify original page content (only overlay UI elements)
- Must respect Content Security Policy (CSP) of host pages
- Storage limited by browser's extension storage quota
- API requests subject to CORS restrictions (must use appropriate API client patterns)
- Cannot access content inside cross-origin iframes
- Must handle pages with dynamic content loading (SPAs) appropriately
