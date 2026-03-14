import React, { useMemo } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react';
import { clsx } from 'clsx';

const OutputWaveform: React.FC = () => {
  const { 
    simulationResult, 
    inputWaveform, 
    selectedId, 
    isProbing, 
    toggleProbing,
    probeVoltage 
  } = useCircuit();

  const data = useMemo(() => {
    if (!simulationResult) return [];
    
    return simulationResult.time.map((t, i) => {
      const point: any = { time: t };
      
      // Include all component/node voltages
      Object.keys(simulationResult.voltages).forEach(node => {
        point[node] = simulationResult.voltages[node][i];
      });

      // Add probe voltage if it exists
      if (probeVoltage) {
        point['Probe'] = probeVoltage[i];
      }
      return point;
    });
  }, [simulationResult, probeVoltage]);

  if (!simulationResult) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
        Run simulation to see output
      </div>
    );
  }

  // Determine which lines to show on the chart
  const visibleNodes = Object.keys(simulationResult.voltages).filter(node => 
    node === 'In' || node === 'Out' || node === selectedId
  );
  if (probeVoltage) {
    visibleNodes.push('Probe');
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 mb-2">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Output ({inputWaveform.type} {inputWaveform.amplitude}V {inputWaveform.frequency}Hz)
        </h3>
        <button
          onClick={toggleProbing}
          className={clsx(
            "flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tight transition-all border",
            isProbing 
              ? "bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
              : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
          )}
        >
          <Zap size={12} className={clsx(isProbing && "fill-amber-400")} />
          {isProbing ? "Probing Active" : "Two-Point Probe"}
        </button>
      </div>
      <div className="flex-1 w-full min-h-[200px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={true} horizontal={true} />
            <XAxis 
              dataKey="time" 
              type="number" 
              domain={['auto', 'auto']} 
              tickFormatter={(t) => (t * 1000).toFixed(1) + 'ms'}
              label={{ value: 'Time', position: 'insideBottomRight', offset: -5, fill: '#10b981' }}
              stroke="#065f46"
              tick={{ fill: '#059669', fontSize: 10 }}
            />
            <YAxis 
              stroke="#065f46"
              tick={{ fill: '#059669', fontSize: 10 }}
              label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#10b981' }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#022c22', borderColor: '#065f46', color: '#34d399' }}
              itemStyle={{ color: '#34d399' }}
              labelStyle={{ color: '#10b981' }}
              formatter={(value: any) => (typeof value === 'number' ? value.toFixed(3) : value) + ' V'}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#10b981' }}/>
            {visibleNodes.map((node) => {
              let strokeColor = "#facc15"; // Default for selected
              let name = `Node ${node}`;
              if (node === 'In') {
                strokeColor = "#22d3ee";
                name = 'Input';
              } else if (node === 'Out') {
                strokeColor = "#4ade80";
                name = 'Output';
              } else if (node === 'Probe') {
                strokeColor = "#fb923c"; // Orange for probe
                name = 'Probe (V1-V2)';
              } else if (node === selectedId) {
                name = `Selected (${components[selectedId]?.label ?? 'Component'})`;
              }

              return (
                <Line 
                  key={node}
                  type="monotone" 
                  dataKey={node} 
                  stroke={strokeColor}
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                  style={{ filter: 'drop-shadow(0 0 3px currentColor)' }}
                  name={name}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OutputWaveform;
