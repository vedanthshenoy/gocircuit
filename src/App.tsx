import React from 'react';
import Header from './components/layout/Header';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import CircuitCanvas from './components/canvas/CircuitCanvas';
import SelectedWaveformPopup from './components/ui/SelectedWaveformPopup';
import ChatInterface from './components/chat/ChatInterface';
import { CircuitProvider } from './store/circuit-store';

const App: React.FC = () => {
  return (
    <CircuitProvider>
      <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Header />
        <main className="flex-1 flex overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 flex flex-col relative min-w-0">
            <CircuitCanvas />
            <SelectedWaveformPopup />
          </div>
          <RightSidebar />
        </main>
        <ChatInterface />
      </div>
    </CircuitProvider>
  );
};

export default App;
