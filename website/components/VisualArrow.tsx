import React from 'react';

export const VisualArrow: React.FC = () => {
  const arrowShape = [
    [1,0,0,0],
    [1,1,0,0],
    [1,1,1,0],
    [1,1,1,1],
    [1,1,1,0],
    [1,1,0,0],
    [1,0,0,0],
  ];

  return (
    <div className="grid grid-cols-4 gap-[1px] select-none">
      {arrowShape.flat().map((filled, i) => {
        if (!filled) return <div key={i} className="w-1 h-1" />;
        
        const col = i % 4;
        const row = Math.floor(i / 4);
        let opacity = 0.3 + (col * 0.25);
        if (row === 2) opacity *= 1.2;
        if (opacity > 1) opacity = 1;
        
        return (
          <div 
            key={i} 
            className="w-1 h-1 bg-iii-accent"
            style={{ opacity }}
          />
        );
      })}
    </div>
  );
};
