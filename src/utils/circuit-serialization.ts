import { type Node, type Edge } from 'reactflow';
import { type CircuitComponent, type InputWaveform } from '../types/circuit';

export const serializeCircuitToMarkdown = (
  nodes: Node[],
  edges: Edge[],
  inputWaveform: InputWaveform
): string => {
  const componentsStr = nodes
    .filter((node) => node.type === 'circuitComponent')
    .map((node) => {
      const data = node.data as CircuitComponent;
      return `- **${data.id}**: ${data.type} (${data.value}${data.unit}) @ (${node.position.x.toFixed(0)}, ${node.position.y.toFixed(0)})`;
    })
    .join('\n');

  const connectionsStr = edges
    .map((edge) => {
      return `- **${edge.source}**(${edge.sourceHandle}) -> **${edge.target}**(${edge.targetHandle})`;
    })
    .join('\n');

  const waveformStr = `- **Type**: ${inputWaveform.type}
- **Amplitude**: ${inputWaveform.amplitude}V
- **Frequency**: ${inputWaveform.frequency}Hz
- **Offset**: ${inputWaveform.offset}V
- **Phase**: ${inputWaveform.phase}°`;

  return `# Circuit Design Document

*This file is managed by the Agent. Do not edit manually.*

## Requirements
(To be populated)

## Components
${componentsStr || '(No components)'}

## Connections
${connectionsStr || '(No connections)'}

## Input Waveform
${waveformStr}

## Analysis
- **Functionality**:
- **Edge Cases**:
- **Transfer Function**:
- **Transient Analysis**:
`;
};

export const deserializeMarkdownToCircuit = (markdown: string): {
  nodes: Node[];
  edges: Edge[];
  inputWaveform: InputWaveform;
} => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const inputWaveform: InputWaveform = {
    type: 'Sine',
    amplitude: 10,
    frequency: 50,
    offset: 0,
    phase: 0
  };

  // Extract sections
  const sections = markdown.split(/## /);
  
  sections.forEach(section => {
    if (section.startsWith('Components')) {
      const lines = section.split('\n').filter(l => l.trim().startsWith('- **'));
      lines.forEach(line => {
        const match = line.match(/- \*\*([^*]+)\*\*: (\w+) \(([\d.e-]+)([^)]+)\) @ \(([\d.-]+), ([\d.-]+)\)/);
        if (match) {
          const [_, id, type, value, unit, x, y] = match;
          nodes.push({
            id,
            type: 'circuitComponent',
            position: { x: parseFloat(x), y: parseFloat(y) },
            data: {
              id,
              type: type as any,
              label: type,
              value: parseFloat(value),
              unit: unit.trim(),
              rotation: 0,
              position: { x: parseFloat(x), y: parseFloat(y) }
            }
          });
        }
      });
    }
 else if (section.startsWith('Connections')) {
      const lines = section.split('\n').filter(l => l.trim().startsWith('- **'));
      lines.forEach(line => {
        const match = line.match(/- \*\*([^*]+)\*\*\(([^)]+)\) -> \*\*([^*]+)\*\*\(([^)]+)\)/);
        if (match) {
          const [_, source, sourceHandle, target, targetHandle] = match;
          edges.push({
            id: `e${source}-${target}-${sourceHandle}-${targetHandle}`,
            source,
            sourceHandle,
            target,
            targetHandle
          });
        }
      });
    } else if (section.startsWith('Input Waveform')) {
      const typeMatch = section.match(/- \*\*Type\*\*: (\w+)/);
      const ampMatch = section.match(/- \*\*Amplitude\*\*: ([\d.e-]+)V/);
      const freqMatch = section.match(/- \*\*Frequency\*\*: ([\d.e-]+)Hz/);
      const offsetMatch = section.match(/- \*\*Offset\*\*: ([\d.e-]+)V/);
      const phaseMatch = section.match(/- \*\*Phase\*\*: ([\d.e-]+)°/);
      
      if (typeMatch) inputWaveform.type = typeMatch[1] as any;
      if (ampMatch) inputWaveform.amplitude = parseFloat(ampMatch[1]);
      if (freqMatch) inputWaveform.frequency = parseFloat(freqMatch[1]);
      if (offsetMatch) inputWaveform.offset = parseFloat(offsetMatch[1]);
      if (phaseMatch) inputWaveform.phase = parseFloat(phaseMatch[1]);
    }
  });

  return { nodes, edges, inputWaveform };
};
