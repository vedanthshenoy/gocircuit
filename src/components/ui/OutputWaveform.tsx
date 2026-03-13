import React, { useMemo } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OutputWaveform: React.FC = () => {
  const { simulationResult, inputWaveform } = useCircuit();

  const data = useMemo(() => {
    if (!simulationResult) return [];
    
    return simulationResult.time.map((t, i) => {
      const point: any = { time: t };
      Object.keys(simulationResult.voltages).forEach(node => {
        point[node] = simulationResult.voltages[node][i];
      });
      return point;
    });
  }, [simulationResult]);

  if (!simulationResult) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
        Run simulation to see output
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-300 mb-2 px-4 pt-4 uppercase tracking-wider">
        Output ({inputWaveform.type} {inputWaveform.amplitude}V {inputWaveform.frequency}Hz)
      </h3>
      <div className="flex-1 w-full min-h-[200px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              type="number" 
              domain={['auto', 'auto']} 
              tickFormatter={(t) => t.toFixed(3)}
              label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5, fill: '#94a3b8' }}
              stroke="#94a3b8"
            />
            <YAxis 
              stroke="#94a3b8"
              label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value: any) => (typeof value === 'number' ? value.toFixed(3) : value) + ' V'}
            />
            <Legend verticalAlign="top" height={36}/>
            {Object.keys(simulationResult.voltages).map((node, index) => (
              <Line 
                key={node}
                type="monotone" 
                dataKey={node} 
                stroke={index === 0 ? "#60a5fa" : "#f472b6"} 
                strokeWidth={2} 
                dot={false}
                name={`Node ${node}`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OutputWaveform;
