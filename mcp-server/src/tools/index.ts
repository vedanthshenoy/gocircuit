import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

// Load .env from project root (relative to this file)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// src/tools/index.ts -> src/tools -> src -> mcp-server -> root
const ROOT_DIR = path.resolve(__dirname, "../../../"); 
dotenv.config({ path: path.resolve(ROOT_DIR, ".env") });

export const CIRCUIT_FILE = path.join(ROOT_DIR, "circuit.md");
export const HISTORY_FILE = path.join(ROOT_DIR, "history.md");
export const SCRATCHPAD_FILE = path.join(ROOT_DIR, "waveform_scratchpad.txt");

export function updateSyncFiles(changeDescription: string, circuitState?: any) {
  const timestamp = new Date().toISOString();
  
  // 1. Update history.md
  const historyEntry = `\n## ${timestamp}\n- ${changeDescription}\n`;
  fs.appendFileSync(HISTORY_FILE, historyEntry);

  // 2. Update waveform_scratchpad.txt
  const scratchpadContent = `# Waveform Scratchpad
Last Updated: ${timestamp}

## Current Change
${changeDescription}

## Circuit Context
${circuitState ? JSON.stringify(circuitState, null, 2) : "Check circuit.md for full state."}
`;
  fs.writeFileSync(SCRATCHPAD_FILE, scratchpadContent);
}

export function sync_chat(args: any) {
  updateSyncFiles(`Chat [${args?.role}]: ${args?.content}`);
  return "Chat message synchronized.";
}

export function select_component(args: any) {
  updateSyncFiles(`Selected component: ${args?.id}`);
  return `Component ${args?.id} selected.`;
}

export function add_component(args: any) {
  updateSyncFiles(`Added component: ${args?.type} at (${args?.x}, ${args?.y})`, args);
  return `Added ${args?.type} at (${args?.x}, ${args?.y}).`;
}

export function update_component(args: any) {
  updateSyncFiles(`Updated component: ${args?.id}`, args);
  return `Updated component ${args?.id} with new properties.`;
}

export function delete_component(args: any) {
  updateSyncFiles(`Deleted component: ${args?.id}`);
  return `Deleted component ${args?.id}.`;
}

export function connect_components(args: any) {
  updateSyncFiles(`Connected ${args?.sourceId} to ${args?.targetId}`, args);
  return `Connected ${args?.sourceId} to ${args?.targetId}.`;
}

export function run_simulation() {
  updateSyncFiles("Ran circuit simulation");
  return JSON.stringify({
    status: "success",
    message: "Simulation complete.",
    data: {
      time: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
      voltage: [0, 2.5, 4.3, 4.8, 4.9, 5.0]
    }
  }, null, 2);
}
