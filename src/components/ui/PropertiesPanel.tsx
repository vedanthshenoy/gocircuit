import { useCircuit } from '../../store/circuit-store';
import { RotateCw, Trash2 } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
  const { selectedId, components, updateComponent, removeComponent, edges } = useCircuit();
  
  const component = selectedId ? components[selectedId] : null;
  const isWire = selectedId && edges.find(e => e.id === selectedId);

  if (!component && !isWire) {
    return (
      <div className="p-4 border-b border-slate-700 text-slate-500 text-sm italic text-center">
        Select a component or wire to edit
      </div>
    );
  }

  if (isWire) {
    return (
      <div className="p-4 border-b border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Wire Properties</h3>
          <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700">
            Wire
          </span>
        </div>
        <div className="space-y-3">
           <div className="text-xs text-slate-400">
             Connection: {isWire.source} → {isWire.target}
           </div>
           <button
            onClick={() => removeComponent(selectedId!)} // reuse removeComponent which handles edges too?
            // Wait, removeComponent in store might only look at components state?
            // Let's check store implementation.
            className="w-full flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 hover:border-red-800 py-1.5 px-3 rounded text-xs font-medium transition-colors"
          >
            <Trash2 size={14} />
            Delete Wire
          </button>
        </div>
      </div>
    );
  }

  // ... Component properties ...
  if (!component) return null;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateComponent(component.id, { value: val });
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateComponent(component.id, { label: e.target.value });
  };

  const handleRotate = () => {
    const newRotation = (component.rotation + 1) % 4;
    updateComponent(component.id, { rotation: newRotation });
  };

  return (
    <div className="p-4 border-b border-slate-700 bg-slate-800/30">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Properties</h3>
        <span className="text-xs px-2 py-0.5 rounded bg-blue-900 text-blue-300 border border-blue-700">
          {component.type}
        </span>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Name</label>
          <input
            type="text"
            value={component.label}
            onChange={handleLabelChange}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {['Resistor', 'Capacitor', 'Inductor', 'VoltageSource'].includes(component.type) && (
          <div className="space-y-1">
            <label className="text-xs text-slate-400">
              Value ({component.unit})
            </label>
            <input
              type="number"
              value={component.value}
              onChange={handleValueChange}
              step="any"
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleRotate}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 px-3 rounded text-xs font-medium transition-colors"
            title="Rotate 90° Clockwise"
          >
            <RotateCw size={14} />
            Flip
          </button>
          <button
            onClick={() => removeComponent(component.id)}
            className="flex-1 flex items-center justify-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 hover:border-red-800 py-1.5 px-3 rounded text-xs font-medium transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
