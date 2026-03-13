import React from 'react';
import { useCircuit } from '../../store/circuit-store';
import { X } from 'lucide-react';

const SelectedTruthTablePopup: React.FC = () => {
  const { selectedId, components, setSelectedId } = useCircuit();

  if (!selectedId) return null;

  const component = components[selectedId];
  if (!component) return null;

  const isLogicGate = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'NOT', 'Buffer'].includes(component.type);
  if (!isLogicGate) return null;

  const getTruthTable = (type: string) => {
    switch (type) {
      case 'AND': return { h: ['A', 'B', 'Y'], r: [[0,0,0], [0,1,0], [1,0,0], [1,1,1]] };
      case 'OR': return { h: ['A', 'B', 'Y'], r: [[0,0,0], [0,1,1], [1,0,1], [1,1,1]] };
      case 'NAND': return { h: ['A', 'B', 'Y'], r: [[0,0,1], [0,1,1], [1,0,1], [1,1,0]] };
      case 'NOR': return { h: ['A', 'B', 'Y'], r: [[0,0,1], [0,1,0], [1,0,0], [1,1,0]] };
      case 'XOR': return { h: ['A', 'B', 'Y'], r: [[0,0,0], [0,1,1], [1,0,1], [1,1,0]] };
      case 'XNOR': return { h: ['A', 'B', 'Y'], r: [[0,0,1], [0,1,0], [1,0,0], [1,1,1]] };
      case 'NOT': return { h: ['A', 'Y'], r: [[0,1], [1,0]] };
      case 'Buffer': return { h: ['A', 'Y'], r: [[0,0], [1,1]] };
      default: return null;
    }
  };

  const table = getTruthTable(component.type);
  if (!table) return null;

  return (
    <div className="absolute top-20 right-4 w-48 bg-slate-900 border-2 border-blue-500 rounded-lg shadow-2xl overflow-hidden z-[100] animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between px-3 py-2 bg-blue-500/20 border-b border-blue-500/30">
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">{component.type} Truth Table</span>
        <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white">
          <X size={12} />
        </button>
      </div>
      <div className="p-2">
        <table className="w-full text-center text-[10px] text-slate-300 border-collapse">
          <thead>
            <tr className="bg-slate-800">
              {table.h.map((h, i) => (
                <th key={i} className="border border-slate-700 p-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.r.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/50">
                {row.map((val, j) => (
                  <td key={j} className={`border border-slate-700 p-1 font-mono ${val === 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectedTruthTablePopup;
