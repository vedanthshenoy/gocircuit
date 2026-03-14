import React from 'react';
import { type ProbePoint } from '../../store/circuit-store';
import { useReactFlow, useStore } from 'reactflow';

interface ProbeMarkerProps {
  point: ProbePoint;
  index: number;
}

const ProbeMarker: React.FC<ProbeMarkerProps> = ({ point, index }) => {
  const { transform } = useStore(state => state.viewport);
  const { x, y } = point;

  const [screenX, screenY] = transform.project([x, y]);

  return (
    <div
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, -50%)', // Center the marker on the point
        zIndex: 1000,
      }}
      className="w-8 h-8 rounded-full bg-orange-500/50 border-2 border-orange-400 flex items-center justify-center text-white font-bold text-sm shadow-lg"
    >
      {index}
    </div>
  );
};

export default ProbeMarker;
