import { LlmAgent } from '@google/adk';
import { GoogleGenAiModel } from '@google/adk';
import { 
  add_component, 
  update_component, 
  delete_component, 
  connect_components, 
  select_component, 
  sync_chat, 
  ROOT_DIR 
} from '../tools/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { waveformAgent } from './waveform.js';

// Define tools

const readProjectFileTool = {
  name: 'read_project_file',
  description: 'Read the content of a file in the project root (e.g., circuit.md).',
  parameters: {
    type: 'OBJECT',
    properties: {
      filename: { type: 'STRING', description: 'The name of the file to read.' },
    },
    required: ['filename'],
  },
  function: async ({ filename }: { filename: string }) => {
    const filePath = path.join(ROOT_DIR, filename);
    try {
      if (!fs.existsSync(filePath)) return `File not found: ${filename}`;
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e: any) {
      return `Error reading file: ${e.message}`;
    }
  },
};

const addComponentTool = {
  name: 'add_component',
  description: 'Add a new electronic component to the circuit.',
  parameters: {
    type: 'OBJECT',
    properties: {
      type: {
        type: 'STRING',
        description: 'The type of component to add (Resistor, Capacitor, Inductor, Diode, VoltageSource, Ground).',
      },
      x: { type: 'NUMBER', description: 'X position on the canvas.' },
      y: { type: 'NUMBER', description: 'Y position on the canvas.' },
    },
    required: ['type', 'x', 'y'],
  },
  function: async (args: any) => add_component(args),
};

const updateComponentTool = {
  name: 'update_component',
  description: 'Update the properties of an existing component.',
  parameters: {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING', description: 'The ID of the component to update.' },
      label: { type: 'STRING' },
      value: { type: 'NUMBER' },
      rotation: { type: 'NUMBER' },
    },
    required: ['id'],
  },
  function: async (args: any) => update_component(args),
};

const deleteComponentTool = {
  name: 'delete_component',
  description: 'Remove a component and its connections from the circuit.',
  parameters: {
    type: 'OBJECT',
    properties: {
      id: { type: 'STRING', description: 'The ID of the component to delete.' },
    },
    required: ['id'],
  },
  function: async (args: any) => delete_component(args),
};

const connectComponentsTool = {
  name: 'connect_components',
  description: 'Create a wire between two component ports.',
  parameters: {
    type: 'OBJECT',
    properties: {
      sourceId: { type: 'STRING' },
      targetId: { type: 'STRING' },
      sourceHandle: { type: 'STRING', description: 'top, bottom, left, right, anode, cathode, p1, p2' },
      targetHandle: { type: 'STRING', description: 'top, bottom, left, right, anode, cathode, p1, p2' },
    },
    required: ['sourceId', 'targetId', 'sourceHandle', 'targetHandle'],
  },
  function: async (args: any) => connect_components(args),
};

const consultWaveformAgentTool = {
  name: 'consult_waveform_agent',
  description: 'Consult the Waveform Subagent for simulation and waveform analysis.',
  parameters: {
    type: 'OBJECT',
    properties: {
      query: { type: 'STRING', description: 'The question or task for the waveform agent.' },
    },
    required: ['query'],
  },
  function: async ({ query }: { query: string }) => {
    try {
      const response = await waveformAgent.run(query);
      return response.text;
    } catch (e: any) {
      return `Error consulting waveform agent: ${e.message}`;
    }
  },
};

const INSTRUCTIONS = `
# Main Circuit Agent

## Purpose
You are the primary agent for the Circuit Playground. Your role is to assist users in designing, modifying, and understanding electronic circuits.

## Capabilities
- **Circuit Design**: You can add, update, delete, and connect components.
- **Circuit Understanding**: You can read 'circuit.md' to understand the current state.
- **Waveform Analysis**: You can delegate simulation and analysis tasks to the 'consult_waveform_agent'.

## Guidelines
- When asked to build a specific circuit (e.g., "Low pass filter"), plan the components and connections, then execute them step-by-step.
- Always check the current circuit state before modifying it to avoid conflicts.
- If the user asks about waveforms, simulation results, or theoretical behavior, consult the Waveform Agent.
`;

export const mainAgent = new LlmAgent({
  name: 'main_agent',
  description: 'Orchestrator for circuit design and analysis.',
  model: new GoogleGenAiModel({
    modelName: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  }),
  instructions: INSTRUCTIONS,
  tools: [
    readProjectFileTool,
    addComponentTool,
    updateComponentTool,
    deleteComponentTool,
    connectComponentsTool,
    consultWaveformAgentTool,
  ],
});
