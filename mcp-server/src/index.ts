import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-2.5-pro";

async function generateWithFallback(prompt: string) {
  if (!genAI) throw new Error("GenAI not initialized");
  
  try {
    const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Primary model (${PRIMARY_MODEL}) failed, trying fallback (${FALLBACK_MODEL})...`, error);
    try {
      const model = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (fallbackError) {
      console.error(`Fallback model (${FALLBACK_MODEL}) also failed:`, fallbackError);
      throw fallbackError;
    }
  }
}

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
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // In a real implementation, this would communicate with the frontend state.
  // For the purpose of this MCP server definition, we describe the intent.
  
  switch (name) {
    case "select_component":
      return {
        content: [{ type: "text", text: `Component ${args?.id} selected.` }],
      };
    case "add_component":
      return {
        content: [{ type: "text", text: `Added ${args?.type} at (${args?.x}, ${args?.y}).` }],
      };
    case "update_component":
      return {
        content: [{ type: "text", text: `Updated component ${args?.id} with new properties.` }],
      };
    case "delete_component":
      return {
        content: [{ type: "text", text: `Deleted component ${args?.id}.` }],
      };
    case "connect_components":
      return {
        content: [{ type: "text", text: `Connected ${args?.sourceId} to ${args?.targetId}.` }],
      };
    case "run_simulation":
      return {
        content: [
          { 
            type: "text", 
            text: JSON.stringify({
              status: "success",
              message: "Simulation complete.",
              data: {
                time: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
                voltage: [0, 2.5, 4.3, 4.8, 4.9, 5.0]
              }
            }, null, 2)
          }
        ],
      };
    default:
      throw new Error(`Tool not found: ${name}`);
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
