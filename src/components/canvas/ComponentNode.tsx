import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { type CircuitComponent } from '../../types/circuit';
import { clsx } from 'clsx';

const ComponentNode = memo(({ data, selected }: NodeProps<CircuitComponent>) => {
  const { type, label, value, unit, rotation } = data;

  const rotateStyle = {
    transform: `rotate(${rotation * 90}deg)`,
  };
  
  const getHandlePosition = (basePosition: Position) => {
    const r = ((rotation % 4) + 4) % 4;
    const positions = [Position.Left, Position.Top, Position.Right, Position.Bottom];
    const index = positions.indexOf(basePosition);
    return positions[(index + r) % 4];
  };

  const isTwoInput = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(type);

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center p-2 rounded transition-all",
        selected ? "ring-2 ring-blue-500 bg-blue-500/10" : "hover:bg-slate-800/50"
      )}
    >
      <div style={rotateStyle} className="relative w-20 h-16 flex items-center justify-center">
        <div className="text-slate-200">
           {getComponentGraphic(type)}
        </div>

        {isTwoInput ? (
          <>
            <Handle
              type="target"
              position={getHandlePosition(Position.Left)}
              id="in1"
              style={{ top: '35%' }}
              className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
            />
            <Handle
              type="target"
              position={getHandlePosition(Position.Left)}
              id="in2"
              style={{ top: '65%' }}
              className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
            />
          </>
        ) : (
          <Handle
            type="target"
            position={getHandlePosition(Position.Left)}
            id="a"
            className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
          />
        )}
        
        <Handle
          type="source"
          position={getHandlePosition(Position.Right)}
          id="out"
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
        />
      </div>

      <div className="absolute -bottom-8 w-32 text-center pointer-events-none">
        <div className="text-[10px] font-bold text-slate-300 truncate">{label}</div>
        <div className="text-[9px] text-slate-500">
          {['Resistor', 'Capacitor', 'Inductor', 'VoltageSource'].includes(type) && (
            `${value} ${unit}`
          )}
        </div>
      </div>
    </div>
  );
});

function getComponentGraphic(type: CircuitComponent['type']) {
  switch (type) {
    case 'AND':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10 5 H30 C45 5 45 35 30 35 H10 V5 Z" />
          <line x1="0" y1="12" x2="10" y2="12" />
          <line x1="0" y1="28" x2="10" y2="28" />
          <line x1="42" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'OR':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 5 Q18 20 8 35 Q35 35 45 20 Q35 5 8 5 Z" />
          <line x1="0" y1="12" x2="12" y2="12" />
          <line x1="0" y1="28" x2="12" y2="28" />
          <line x1="45" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'NAND':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10 5 H25 C40 5 40 35 25 35 H10 V5 Z" />
          <circle cx="43" cy="20" r="3.5" strokeWidth="2" />
          <line x1="0" y1="12" x2="10" y2="12" />
          <line x1="0" y1="28" x2="10" y2="28" />
          <line x1="47" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'NOR':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M8 5 Q18 20 8 35 Q32 35 40 20 Q32 5 8 5 Z" />
          <circle cx="45" cy="20" r="3.5" strokeWidth="2" />
          <line x1="0" y1="12" x2="13" y2="12" />
          <line x1="0" y1="28" x2="13" y2="28" />
          <line x1="49" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'XOR':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 5 Q13 20 3 35" />
          <path d="M10 5 Q20 20 10 35 Q37 35 47 20 Q37 5 10 5 Z" />
          <line x1="0" y1="12" x2="6" y2="12" />
          <line x1="0" y1="28" x2="6" y2="28" />
          <line x1="47" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'XNOR':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 5 Q13 20 3 35" />
          <path d="M10 5 Q20 20 10 35 Q32 35 42 20 Q32 5 10 5 Z" />
          <circle cx="46" cy="20" r="3.5" strokeWidth="2" />
          <line x1="0" y1="12" x2="6" y2="12" />
          <line x1="0" y1="28" x2="6" y2="28" />
          <line x1="50" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'NOT':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 8 L35 20 L15 32 Z" />
          <circle cx="40" cy="20" r="3.5" strokeWidth="2" />
          <line x1="0" y1="20" x2="15" y2="20" />
          <line x1="44" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'Buffer':
      return (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 8 L40 20 L15 32 Z" />
          <line x1="0" y1="20" x2="15" y2="20" />
          <line x1="40" y1="20" x2="60" y2="20" />
        </svg>
      );
    case 'Resistor':
      return (
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H10 L15 3 L25 17 L35 3 L45 17 L50 10 H60" />
        </svg>
      );
    case 'Capacitor':
      return (
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 15 H25" />
          <path d="M35 15 H60" />
          <line x1="25" y1="5" x2="25" y2="25" />
          <line x1="35" y1="5" x2="35" y2="25" />
        </svg>
      );
    case 'Inductor':
      return (
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H10 Q15 0 20 10 Q25 0 30 10 Q35 0 40 10 Q45 0 50 10 H60" />
        </svg>
      );
    case 'Diode':
      return (
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 15 H22" />
          <path d="M38 15 H60" />
          <path d="M22 15 L38 5 V25 Z" fill="currentColor" />
          <line x1="38" y1="5" x2="38" y2="25" />
        </svg>
      );
    case 'VoltageSource':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="30" cy="30" r="20" />
          <path d="M30 18 V26" strokeWidth="1.5" />
          <path d="M26 22 H34" strokeWidth="1.5" />
          <path d="M26 38 H34" strokeWidth="1.5" />
          <path d="M30 0 V10" />
          <path d="M30 50 V60" />
        </svg>
      );
     case 'Ground':
      return (
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2">
           <path d="M30 0 V30" />
           <path d="M15 30 H45" />
           <path d="M20 38 H40" />
           <path d="M26 46 H34" />
        </svg>
      );
    default:
      return <div className="w-8 h-8 border border-dashed border-slate-500" />;
  }
}

export default ComponentNode;
