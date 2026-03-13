import React, { useMemo } from 'react';
import { useCircuit } from '../../store/circuit-store';
import { Play, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const InputWaveformPanel: React.FC = () => {
  const { inputWaveform, setInputWaveform, runSimulation } = useCircuit();

  const data = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 360; i += 10) {
      const rad = (i * Math.PI) / 180;
      points.push({
        x: i,
        y: inputWaveform.amplitude * Math.sin(rad * inputWaveform.frequency * 0.1) // scaled for preview
      });
    }
    return points;
  }, [inputWaveform]);

  const handleChange = (field: keyof typeof inputWaveform, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setInputWaveform({ ...inputWaveform, [field]: num });
    }
  };

  return (
    <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-1 flex flex-col min-h-0">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
        <Activity size={16} className="text-blue-400" />
        Input Waveform
      </h3>

      <div className="h-24 bg-slate-900 border border-slate-700 rounded mb-3 overflow-hidden relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="x" hide />
            <YAxis hide domain={[-inputWaveform.amplitude * 1.2, inputWaveform.amplitude * 1.2]} />
            <Line 
              type="monotone" 
              dataKey="y" 
              stroke="#60a5fa" 
              strokeWidth={2} 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute bottom-1 right-2 text-[10px] text-slate-500 font-mono">
          {inputWaveform.frequency}Hz
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Amplitude (V)</label>
            <input
              type="number"
              value={inputWaveform.amplitude}
              onChange={(e) => handleChange('amplitude', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-500 font-semibold">Frequency (Hz)</label>
            <input
              type="number"
              value={inputWaveform.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={runSimulation}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition-colors shadow-lg shadow-green-900/20"
      >
        <Play size={16} fill="currentColor" />
        Run Simulation
      </button>
    </div>
  );
};

export default InputWaveformPanel;
