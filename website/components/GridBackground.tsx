import React, { useEffect, useRef } from 'react';

interface GridBackgroundProps {
  isDarkMode?: boolean;
}

export const GridBackground: React.FC<GridBackgroundProps> = ({ isDarkMode = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = 1;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseLeave = () => {
      mousePosRef.current = { x: -1000, y: -1000 };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    window.addEventListener('resize', resize);
    resize();

    const gridSize = 32;
    const colors = isDarkMode ? {
      bg: '#000000',
      gridLine: 'rgba(255, 255, 255, 0.04)',
      arrowLight: '#555555',
      arrowHighlight: '#666666'
    } : {
      bg: '#F4F4F4',
      gridLine: 'rgba(0, 0, 0, 0.06)',
      arrowLight: '#CCCCCC',
      arrowHighlight: '#AAAAAA'
    };

    const arrowPattern = [
      [1,0,0,0,0,0,0],
      [2,1,0,0,0,0,0],
      [2,2,1,0,0,0,0],
      [2,2,2,1,0,0,0],
      [2,2,1,0,0,0,0],
      [2,1,0,0,0,0,0],
      [1,0,0,0,0,0,0],
    ];
    
    const arrowW = 7;
    const arrowH = 7;
    const tileW = arrowW + 8;
    const tileH = arrowH + 8;

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const mousePos = mousePosRef.current;
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      const hoverRadius = 250;
      const cols = Math.ceil(width / gridSize) + 1;
      const rows = Math.ceil(height / gridSize) + 1;
      
      if (mousePos.x > -500 && mousePos.y > -500) {
        for (let cellY = 0; cellY < rows; cellY++) {
          const yPos = cellY * gridSize;
          if (Math.abs(yPos - mousePos.y) > hoverRadius + gridSize) continue;

          for (let cellX = 0; cellX < cols; cellX++) {
            const xPos = cellX * gridSize;
            const dx = xPos + gridSize / 2 - mousePos.x;
            const dy = yPos + gridSize / 2 - mousePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < hoverRadius) {
              const opacity = Math.pow(1 - dist / hoverRadius, 1.2);
              const rowIndex = Math.floor(cellY / tileH);
              const xOffset = (rowIndex % 2) * Math.floor(tileW / 2);
              const localX = ((cellX + xOffset) % tileW + tileW) % tileW;
              const localY = ((cellY % tileH) + tileH) % tileH;
              
              if (localX < arrowW && localY < arrowH) {
                const val = arrowPattern[localY][localX];
                if (val > 0) {
                  ctx.fillStyle = val === 1 ? colors.arrowHighlight : colors.arrowLight;
                  ctx.globalAlpha = opacity * (val === 1 ? 0.7 : 0.5);
                  ctx.fillRect(xPos + 1, yPos + 1, gridSize - 2, gridSize - 2);
                  ctx.globalAlpha = 1.0;
                }
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDarkMode]);

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden ${isDarkMode ? 'bg-iii-black' : 'bg-iii-light'}`}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className={`absolute inset-0 pointer-events-none ${
        isDarkMode 
          ? 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]' 
          : 'bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(244,244,244,0.6)_100%)]'
      }`} />
    </div>
  );
};
