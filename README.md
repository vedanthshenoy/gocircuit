# Circuit Playground

A visually rich, interactive electronic circuit simulation and design environment.

## AI Agent Architecture (ADK Implementation)

The project utilizes the **Google Agent Development Kit (ADK)** to implement a multi-agent system for circuit design and analysis. This architecture is exposed via a **Model Context Protocol (MCP)** server.

### Agents
- **Main Agent**: The primary orchestrator. Handles high-level circuit design, component management (add, update, delete, connect), and user communication. It can delegate complex tasks to specialized subagents.
- **Waveform Agent (Subagent)**: Specialized in simulation and waveform analysis. It derives mathematical models (transfer functions, differential equations) and processes simulation data to provide accurate output waveforms.

### MCP Server Integration
The backend in `mcp-server/` acts as the bridge between the AI agents and the playground. It exposes tools that the agents use to interact with the circuit and a high-level `ask_circuit_agent` tool for users.

#### Setup (MCP Server)
1. Navigate to the `mcp-server` directory:
   ```bash
   cd mcp-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the server:
   ```bash
   npm run build
   ```
4. Start the server:
   ```bash
   npm start
   ```

## Development

### Frontend (React + Vite)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Technologies Used
- **Frontend**: React 19, TypeScript, Vite, ReactFlow, Recharts, Tailwind CSS.
- **AI**: Google Agent Development Kit (ADK), Gemini 2.5 models.
- **Protocol**: Model Context Protocol (MCP).
