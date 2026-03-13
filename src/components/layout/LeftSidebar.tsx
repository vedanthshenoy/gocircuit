import React from 'react';
import Toolbox from '../ui/Toolbox';
import PropertiesPanel from '../ui/PropertiesPanel';
import InputWaveformPanel from '../ui/InputWaveformPanel';

const LeftSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full overflow-y-auto">
      <Toolbox />
      <PropertiesPanel />
      <InputWaveformPanel />
    </aside>
  );
};

export default LeftSidebar;
