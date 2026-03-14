import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as tools from "./tools/index.js";
import { mainAgent } from "./agents/main-agent.js";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../");
dotenv.config({ path: path.resolve(ROOT_DIR, ".env") });

const server = new Server(
  {
    name: "CircuitPlayground",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const RESOURCES = {
  "electronics-basics": {
    uri: "electronics://basics",
    name: "Electronics Basics",
    description: "Fundamental concepts of electronics: Voltage, Current, Resistance, Power.",
    content: `
# Electronics Basics

## Voltage (V)
The electrical potential difference between two points. Measured in Volts (V).

## Current (I)
The flow of electric charge. Measured in Amperes (A).

## Resistance (R)
The opposition to current flow. Measured in Ohms (Ω).

## Ohm's Law
V = I * R

## Power (P)
The rate at which energy is used. P = V * I = I² * R.
    `,
  },
  "component-guide": {
    uri: "electronics://components",
    name: "Component Guide",
    description: "Detailed information about electronic components available in the playground.",
    content: `
# Component Guide

## Resistor
Limits current flow. Used for voltage division, current limiting, and biasing.

## Capacitor
Stores energy in an electric field. Blocks DC, passes AC. Used for filtering and coupling.

## Inductor
Stores energy in a magnetic field. Resists changes in current. Used for filtering and in resonant circuits.

## Diode
Allows current to flow in one direction only. Used for rectification and protection.

## Voltage Source
Provides the energy to the circuit. Can be DC or AC.
    `,
  },
};

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.values(RESOURCES).map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
    })),
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resource = Object.values(RESOURCES).find((r) => r.uri === request.params.uri);
  if (!resource) {
    throw new Error(`Resource not found: ${request.params.uri}`);
  }

  return {
    contents: [
      {
        uri: resource.uri,
        mimeType: "text/markdown",
        text: resource.content,
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_circuit_agent",
        description: "Ask the AI Circuit Agent to help with circuit design, modification, or analysis. It can perform complex tasks.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "The request or question for the agent." },
          },
          required: ["query"],
        },
      },
      {
        name: "select_component",
        description: "Select a component in the circuit to view or edit its properties.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the component to select." },
          },
          required: ["id"],
        },
      },
      {
        name: "add_component",
        description: "Add a new electronic component to the circuit.",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["Resistor", "Capacitor", "Inductor", "Diode", "VoltageSource", "Ground"],
              description: "The type of component to add.",
            },
            x: { type: "number", description: "X position on the canvas." },
            y: { type: "number", description: "Y position on the canvas." },
          },
          required: ["type", "x", "y"],
        },
      },
      {
        name: "update_component",
        description: "Update the properties of an existing component.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the component to update." },
            label: { type: "string" },
            value: { type: "number" },
            rotation: { type: "number", description: "Rotation in 90-degree increments (0-3)." },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_component",
        description: "Remove a component and its connections from the circuit.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the component to delete." },
          },
          required: ["id"],
        },
      },
      {
        name: "connect_components",
        description: "Create a wire between two component ports.",
        inputSchema: {
          type: "object",
          properties: {
            sourceId: { type: "string" },
            targetId: { type: "string" },
            sourceHandle: { type: "string", enum: ["top", "bottom", "left", "right", "anode", "cathode", "p1", "p2"] },
            targetHandle: { type: "string", enum: ["top", "bottom", "left", "right", "anode", "cathode", "p1", "p2"] },
          },
          required: ["sourceId", "targetId", "sourceHandle", "targetHandle"],
        },
      },
      {
        name: "run_simulation",
        description: "Run the electronic simulation and get the results.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "sync_chat",
        description: "Synchronize chat messages with history.md and the waveform scratchpad.",
        inputSchema: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
          },
          required: ["role", "content"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "ask_circuit_agent":
        if (!args || typeof args.query !== "string") {
          throw new Error("Invalid arguments for ask_circuit_agent: query is required.");
        }
        const agentResponse = await mainAgent.run(args.query);
        // Assuming agentResponse.text is the output string
        return {
          content: [{ type: "text", text: agentResponse.text || JSON.stringify(agentResponse) }],
        };
      case "sync_chat":
        return { content: [{ type: "text", text: tools.sync_chat(args) }] };
      case "select_component":
        return { content: [{ type: "text", text: tools.select_component(args) }] };
      case "add_component":
        return { content: [{ type: "text", text: tools.add_component(args) }] };
      case "update_component":
        return { content: [{ type: "text", text: tools.update_component(args) }] };
      case "delete_component":
        return { content: [{ type: "text", text: tools.delete_component(args) }] };
      case "connect_components":
        return { content: [{ type: "text", text: tools.connect_components(args) }] };
      case "run_simulation":
        return { content: [{ type: "text", text: tools.run_simulation() }] };
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error executing tool ${name}:`, error);
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CircuitPlayground MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
