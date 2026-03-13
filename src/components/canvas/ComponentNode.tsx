import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { type CircuitComponent } from '../../types/circuit';
import { clsx } from 'clsx';

const ComponentNode = memo(({ data, selected }: NodeProps<CircuitComponent>) => {
  const { type, label, value, unit, rotation } = data;

  const rotateStyle = {
    transform: `rotate(${rotation * 90}deg)`,
  };
  
  // Adjust handle positions based on rotation
  // 0: Left-Right
  // 1: Top-Bottom
  // 2: Right-Left
  // 3: Bottom-Top
  
  // Actually, if we rotate the whole container, handles rotate too.
  // But we need to keep label upright?
  // Let's just rotate the graphic and handles container.

  const getHandlePosition = (basePosition: Position) => {
    const r = ((rotation % 4) + 4) % 4; // Ensure positive 0-3
    if (r === 0) return basePosition;
    
    // Mapping for rotation (clockwise)
    // 0: L->L, R->R
    // 1: L->T, R->B
    // 2: L->R, R->L
    // 3: L->B, R->T
    
    if (basePosition === Position.Left) {
      return [Position.Left, Position.Top, Position.Right, Position.Bottom][r];
    }
    if (basePosition === Position.Right) {
      return [Position.Right, Position.Bottom, Position.Left, Position.Top][r];
    }
    return basePosition;
  };

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center p-2 rounded transition-all",
        selected ? "ring-2 ring-blue-500 bg-blue-500/10" : "hover:bg-slate-800/50"
      )}
    >
      <div style={rotateStyle} className="relative w-12 h-12 flex items-center justify-center">
        {/* Component Graphic */}
        <div className="text-slate-200">
           {getComponentGraphic(type)}
        </div>

        {/* Handles */}
        <Handle
          type="target"
          position={getHandlePosition(Position.Left)}
          id="a"
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
        />
        <Handle
          type="source"
          position={getHandlePosition(Position.Right)}
          id="b"
          className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-800 hover:!bg-blue-400"
        />
      </div>

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
