# Plan: Convert MCP Server to use Google ADK

## Objective
Refactor the `mcp-server` to use the Google Agent Development Kit (ADK) for implementing the "Main Agent" and "Waveform Subagent". The backend will remain an MCP server, but it will utilize ADK agents to handle complex logic and workflows.

## Context
- **Current State**: `mcp-server/src/index.ts` is a basic MCP server exposing raw tools (`add_component`, `run_simulation`, etc.).
- **Goal**: Introduce `MainAgent` and `WaveformAgent` using `@google/adk`.
- **References**:
    - `skills/waveform_generator/SKILL.md`: Instructions for the Waveform Subagent.
    - `mcp-server/src/index.ts`: Current tool implementations.

## Architecture

### 1. Dependencies
- Add `@google/adk` to `mcp-server/package.json`.
- Add `@google/generative-ai` (already present).

### 2. Agents

#### A. Waveform Agent (`src/agents/waveform.ts`)
- **Role**: Specialized in simulation and waveform analysis.
- **Tools**:
    - `read_file` (to read `waveform_scratchpad.txt`, `circuit.md`).
    - `run_simulation` (the existing logic wrapped as a tool).
    - `generate_waveform_data` (new tool or logic to calculate theoretical waveforms).
- **Instructions**: Derived from `skills/waveform_generator/SKILL.md`.
- **Model**: Gemini (via ADK).

#### B. Main Agent (`src/agents/main.ts`)
- **Role**: Orchestrator and Circuit Designer.
- **Tools**:
    - `add_component`, `update_component`, `delete_component`, `connect_components`.
    - `delegate_to_waveform_agent` (to call the subagent).
- **Instructions**: General circuit design and management.
- **Model**: Gemini (via ADK).

### 3. Integration (`src/index.ts`)
- The MCP server will continue to run.
- **New Tool**: `ask_agent` (or similar) that sends a prompt to the `MainAgent`.
- **Existing Tools**: Keep them as low-level tools that the *Agent* can use, but also expose them to the client if needed.
    - *Decision*: For this refactor, we will likely wrap the existing logic into "Tools" that the ADK Agents can use. The MCP server will expose a way to invoke the Main Agent, or the Main Agent *is* the logic behind a "smart" tool.
    - *Refined Approach*: The MCP server can expose a tool `consult_circuit_agent` that takes a user query. The `MainAgent` processes this query, calls necessary tools (modifying circuit, running sim), and returns the result.

## Implementation Steps

1.  **Install ADK**: Add `@google/adk` to `package.json`.
2.  **Refactor Tools**: Move the logic from `index.ts` into a `tools.ts` file so it can be imported by both the MCP server (legacy support) and the new ADK agents.
3.  **Implement Waveform Agent**: Create `src/agents/waveform.ts` using `LlmAgent` and `skills/waveform_generator/SKILL.md` instructions.
4.  **Implement Main Agent**: Create `src/agents/main.ts` using `LlmAgent`. Give it access to the circuit modification tools and the Waveform Agent.
5.  **Update MCP Server**: In `src/index.ts`, add a handler (maybe a tool or resource) that triggers the `MainAgent`.
    - Note: Since the user asked to "convert and rewrite", we might want the *primary* interaction to be through the agent. However, to keep the UI working (which likely calls `add_component` directly), we must keep the low-level tools exposed. We will add a new "Agent" capability.

## Verification
- Run `npm run build` in `mcp-server`.
- Verify the server starts.
- (Manual) Test if the agent can be invoked.
