import React from 'react';
import { Save, RotateCcw, FolderOpen } from 'lucide-react';
import { useCircuit } from '../../store/circuit-store';
import { serializeCircuitToMarkdown, deserializeMarkdownToCircuit } from '../../utils/circuit-serialization';

const Header: React.FC = () => {
  const { nodes, edges, inputWaveform, setNodes, setEdges, setInputWaveform, setComponents } = useCircuit();

  const handleSave = () => {
    const markdown = serializeCircuitToMarkdown(nodes, edges, inputWaveform);
    localStorage.setItem('gocircuit_save', markdown);
    alert('Circuit saved to local storage!');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('gocircuit_save');
    if (saved) {
      try {
        const { nodes, edges, inputWaveform } = deserializeMarkdownToCircuit(saved);
        setNodes(nodes);
        setEdges(edges);
        setInputWaveform(inputWaveform);
        
        // Rebuild components mapping
        const components: any = {};
        nodes.forEach(node => {
          if (node.type === 'circuitComponent') {
            components[node.id] = node.data;
          }
        });
        setComponents(components);
        alert('Circuit loaded successfully!');
      } catch (e) {
        console.error('Failed to load circuit:', e);
        alert('Failed to load saved circuit.');
      }
    } else {
      alert('No saved circuit found.');
    }
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-blue-400">⚡ Electronics Playground</h1>
      </div>
      <div className="flex items-center gap-2">
        <button 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          onClick={() => {
            if (confirm('Are you sure you want to reset the circuit?')) {
               window.location.reload();
            }
          }}
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          onClick={handleLoad}
        >
          <FolderOpen size={16} />
          Load
        </button>
        <button 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors shadow-sm"
          onClick={handleSave}
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </header>
  );
};

export default Header;
