import { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { type CircuitComponent } from '../../types/circuit';
import { useCircuit } from '../../store/circuit-store';
import { clsx } from 'clsx';

const ComponentNode = memo(({ id, data, selected }: NodeProps<CircuitComponent>) => {
  const { type, label, value, unit, rotation } = data;
  const { highlightedIds } = useCircuit();

  const isHighlighted = useMemo(() => highlightedIds.includes(id), [highlightedIds, id]);

  const rotateStyle = {
    transform: `rotate(${rotation * 90}deg)`,
  };
  
  const isVerticalDefault = type === 'VoltageSource' || type === 'Ground';

  const getHandlePosition = (basePosition: Position) => {
    const r = ((rotation % 4) + 4) % 4;
    
    let currentPosition = basePosition;
    if (isVerticalDefault) {
      if (basePosition === Position.Left) currentPosition = Position.Top;
      if (basePosition === Position.Right) currentPosition = Position.Bottom;
    }

    if (r === 0) return currentPosition;
    
    const positions = [Position.Top, Position.Right, Position.Bottom, Position.Left];
    const currentIndex = positions.indexOf(currentPosition);
    return positions[(currentIndex + r) % 4];
  };

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center rounded transition-all",
        selected ? "ring-2 ring-blue-500 bg-blue-500/10" : "hover:bg-slate-800/50",
        isHighlighted && "ring-4 ring-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse"
      )}
    >
      {/* Container for Graphic and Handles - Graphic rotates, Handles move logically */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Component Graphic - Only rotate the visual representation */}
        <div style={rotateStyle} className="text-slate-200">
           {getComponentGraphic(type)}
        </div>

        {/* Handles - Positioned logically on the node edges */}
        <Handle
          type="target"
          position={getHandlePosition(Position.Left)}
          id="a"
          className="!w-2 !h-2 !bg-blue-400 !border-none !rounded-full opacity-0 group-hover:opacity-100 hover:!opacity-100"
          style={{ visibility: 'visible' }} // Ensure they are active but small
        />
        {type !== 'Ground' && (
          <Handle
            type="source"
            position={getHandlePosition(Position.Right)}
            id="b"
            className="!w-2 !h-2 !bg-blue-400 !border-none !rounded-full opacity-0 group-hover:opacity-100 hover:!opacity-100"
            style={{ visibility: 'visible' }}
          />
        )}
      </div>

      {/* Label (always upright, positioned outside the box) */}

      {/* Label (always upright-ish or below) */}
      <div className="absolute -bottom-6 w-32 text-center pointer-events-none">
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
    case 'Resistor':
      return (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H5 L10 5 L15 15 L20 5 L25 15 L30 5 L35 10 H40" />
        </svg>
      );
    case 'Capacitor':
      return (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H16" />
          <path d="M24 10 H40" />
          <line x1="16" y1="2" x2="16" y2="18" />
          <line x1="24" y1="2" x2="24" y2="18" />
        </svg>
      );
    case 'Inductor':
      return (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H5 Q10 -5 15 10 Q20 -5 25 10 Q30 -5 35 10 H40" />
        </svg>
      );
    case 'Diode':
      return (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M0 10 H14" />
          <path d="M26 10 H40" />
          <path d="M14 10 L26 4 V16 Z" fill="currentColor" />
          <line x1="26" y1="4" x2="26" y2="16" />
        </svg>
      );
    case 'VoltageSource':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="20" cy="20" r="14" />
          <path d="M20 10 V16" />
          <path d="M17 13 H23" />
          <path d="M20 24 V30" />
          <path d="M17 27 H23" /> {/* Wait, simple + and - */}
          {/* DC Source symbol */}
          <path d="M20 6 V20 M20 20 V34" stroke="transparent" /> {/* connection lines */}
          
          {/* redraw better */}
          <path d="M20 0 V6" />
          <path d="M20 34 V40" />
          <path d="M20 10 V18" strokeWidth="1" /> 
          <text x="14" y="16" fontSize="10" fill="currentColor">+</text>
          <text x="14" y="28" fontSize="10" fill="currentColor">-</text>
        </svg>
      );
     case 'Ground':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
           <path d="M20 0 V20" />
           <path d="M10 20 H30" />
           <path d="M14 26 H26" />
           <path d="M18 32 H22" />
        </svg>
      );
    default:
      return <div className="w-8 h-8 border border-dashed border-slate-500" />;
  }
}

export default ComponentNode;
