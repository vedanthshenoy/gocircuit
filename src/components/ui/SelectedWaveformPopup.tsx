import React, { useMemo } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';

const SelectedWaveformPopup: React.FC = () => {
  const { 
    selectedId, 
    simulationResult, 
    setSelectedId,
    probeVoltage,
    probePoints,
    clearProbePoints
  } = useCircuit();

  const isProbeActive = probePoints.length === 2 && !!probeVoltage;

  const data = useMemo(() => {
    if (!simulationResult) return [];

    let displayVoltage: number[] | null = null;
    if (isProbeActive) {
      displayVoltage = probeVoltage;
    } else if (selectedId) {
      displayVoltage = simulationResult.voltages[selectedId];
    }
    
    if (!displayVoltage) return [];
    
    return simulationResult.time.map((t, i) => ({
      time: t,
      voltage: displayVoltage![i] || 0
    }));
  }, [simulationResult, selectedId, probeVoltage, isProbeActive]);

  const handleClose = () => {
    if (isProbeActive) {
      clearProbePoints();
    } else {
      setSelectedId(null);
    }
  };

  if (!isProbeActive && !selectedId) return null;
  if (!simulationResult || data.length === 0) return null;

  const title = isProbeActive 
    ? 'Probe V(p1, p2)' 
    : `Selected: ${selectedId?.slice(0, 8)}...`;

  return (
    <div className="absolute bottom-4 right-4 w-80 h-48 bg-slate-900 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">{title}</span>
        <button onClick={handleClose} className="text-slate-400 hover:text-white">
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
            <Line type="monotone" dataKey="voltage" stroke="#fb923c" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SelectedWaveformPopup;
