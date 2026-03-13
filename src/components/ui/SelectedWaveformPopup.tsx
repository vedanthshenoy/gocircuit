import React, { useMemo } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

const SelectedWaveformPopup: React.FC = () => {
  const { selectedId, simulationResult, setSelectedId } = useCircuit();

  const data = useMemo(() => {
    if (!simulationResult || !selectedId) return [];
    
    // For now, mock specific data for selected ID or reuse 'out' if available
    // In a real app, simulationResult would have data for each component/node ID
    const voltages = simulationResult.voltages['out'] || []; 
    
    return simulationResult.time.map((t, i) => ({
      time: t,
      voltage: voltages[i] || 0 // Fallback
    }));
  }, [simulationResult, selectedId]);

  if (!selectedId || !simulationResult) return null;

  return (
    <div className="absolute bottom-4 right-4 w-80 h-48 bg-slate-900 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">Selected: {selectedId.slice(0, 8)}...</span>
        <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: '10px' }}
              itemStyle={{ color: '#f1f5f9' }}
              formatter={(val: any) => (typeof val === 'number' ? val.toFixed(2) : val) + 'V'}
              labelFormatter={() => ''}
            />
            <Line type="monotone" dataKey="voltage" stroke="#fbbf24" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SelectedWaveformPopup;
