import React from 'react';
import { type ComponentType } from '../../types/circuit';
import { Battery } from 'lucide-react'; // Placeholder icons

const TOOLS: { type: ComponentType; icon: React.ReactNode; label: string }[] = [
  { type: 'Resistor', icon: <div className="font-bold border border-current px-1 rounded text-xs">R</div>, label: 'Resistor' },
  { type: 'Capacitor', icon: <div className="font-bold border-x-2 border-current px-1 h-3 w-3"></div>, label: 'Capacitor' },
  { type: 'Inductor', icon: <div className="font-bold text-xs">L</div>, label: 'Inductor' },
  { type: 'Diode', icon: <div className="font-bold text-xs">D</div>, label: 'Diode' },
  { type: 'VoltageSource', icon: <Battery size={16} />, label: 'Voltage Source' },
  { type: 'Ground', icon: <div className="font-bold text-xs">GND</div>, label: 'Ground' },
];

const Toolbox: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: ComponentType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="p-4 border-b border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Components</h3>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((tool) => (
          <div
            key={tool.type}
            className="flex flex-col items-center justify-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-grab active:cursor-grabbing border border-slate-700 hover:border-slate-500 transition-all"
            onDragStart={(event) => onDragStart(event, tool.type)}
            draggable
          >
            <div className="mb-2 text-blue-400">{tool.icon}</div>
            <span className="text-xs text-slate-300 font-medium">{tool.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toolbox;
