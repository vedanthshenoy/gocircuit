import React from 'react';
import OutputWaveform from '../ui/OutputWaveform';

const RightSidebar: React.FC = () => {
  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-700 flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0">
        <OutputWaveform />
      </div>
    </aside>
  );
};

export default RightSidebar;
