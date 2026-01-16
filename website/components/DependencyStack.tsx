import { useEffect, useState, useRef } from "react";

interface Box {
  id: number;
  width: number;
  height: number;
  // Position in the xkcd dependency stack
  stackX: number;
  stackY: number;
  // Position in the uniform grid
  gridX: number;
  gridY: number;
}

// Grid configuration for the final uniform square
const GRID_SIZE = 5; // 5x5 grid = 25 boxes
const BOX_SIZE = 80;
const BOX_GAP = 16;
const SCALE = 2; // Scale factor for the stack

// Create boxes that form the dependency stack, then rearrange into a grid
const createBoxes = (): Box[] => {
  const boxes: Box[] = [];

  // Define stack positions (xkcd dependency tower formation) - scaled up
  const stackPositions = [
    // Base platform layers (bottom)
    { x: 0 * SCALE, y: 340 * SCALE, w: 180 * SCALE, h: 18 * SCALE },
    { x: 0 * SCALE, y: 318 * SCALE, w: 160 * SCALE, h: 16 * SCALE },
    { x: 0 * SCALE, y: 298 * SCALE, w: 140 * SCALE, h: 14 * SCALE },

    // Main foundation block
    { x: 0 * SCALE, y: 240 * SCALE, w: 120 * SCALE, h: 50 * SCALE },

    // The critical small "Nebraska" block
    { x: -15 * SCALE, y: 210 * SCALE, w: 30 * SCALE, h: 22 * SCALE },

    // Middle support layer
    { x: 10 * SCALE, y: 175 * SCALE, w: 100 * SCALE, h: 30 * SCALE },
    { x: -20 * SCALE, y: 140 * SCALE, w: 80 * SCALE, h: 28 * SCALE },

    // Left tower
    { x: -45 * SCALE, y: 95 * SCALE, w: 22 * SCALE, h: 40 * SCALE },
    { x: -48 * SCALE, y: 55 * SCALE, w: 18 * SCALE, h: 35 * SCALE },
    { x: -44 * SCALE, y: 22 * SCALE, w: 14 * SCALE, h: 28 * SCALE },
    { x: -46 * SCALE, y: -8 * SCALE, w: 12 * SCALE, h: 22 * SCALE },
    { x: -44 * SCALE, y: -32 * SCALE, w: 10 * SCALE, h: 18 * SCALE },

    // Middle tower (tallest)
    { x: 0 * SCALE, y: 85 * SCALE, w: 26 * SCALE, h: 48 * SCALE },
    { x: 3 * SCALE, y: 40 * SCALE, w: 22 * SCALE, h: 42 * SCALE },
    { x: -2 * SCALE, y: 0 * SCALE, w: 18 * SCALE, h: 36 * SCALE },
    { x: 2 * SCALE, y: -35 * SCALE, w: 14 * SCALE, h: 28 * SCALE },
    { x: 0 * SCALE, y: -60 * SCALE, w: 12 * SCALE, h: 22 * SCALE },
    { x: 1 * SCALE, y: -82 * SCALE, w: 10 * SCALE, h: 18 * SCALE },

    // Right tower
    { x: 45 * SCALE, y: 90 * SCALE, w: 24 * SCALE, h: 44 * SCALE },
    { x: 48 * SCALE, y: 48 * SCALE, w: 20 * SCALE, h: 38 * SCALE },
    { x: 44 * SCALE, y: 12 * SCALE, w: 16 * SCALE, h: 32 * SCALE },
    { x: 46 * SCALE, y: -18 * SCALE, w: 12 * SCALE, h: 24 * SCALE },
    { x: 44 * SCALE, y: -42 * SCALE, w: 10 * SCALE, h: 20 * SCALE },

    // Tiny blocks on top for detail
    { x: -42 * SCALE, y: -48 * SCALE, w: 8 * SCALE, h: 12 * SCALE },
    { x: 2 * SCALE, y: -98 * SCALE, w: 8 * SCALE, h: 14 * SCALE },
  ];

  // Calculate grid positions for uniform square
  const totalGridWidth = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const totalGridHeight = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const gridStartX = -totalGridWidth / 2;
  const gridStartY = -totalGridHeight / 2 + 200; // Center vertically with slight offset

  for (let i = 0; i < stackPositions.length; i++) {
    const stack = stackPositions[i];
    const gridRow = Math.floor(i / GRID_SIZE);
    const gridCol = i % GRID_SIZE;

    boxes.push({
      id: i,
      width: stack.w,
      height: stack.h,
      stackX: stack.x,
      stackY: stack.y,
      gridX: gridStartX + gridCol * (BOX_SIZE + BOX_GAP) + BOX_SIZE / 2,
      gridY: gridStartY + gridRow * (BOX_SIZE + BOX_GAP) + BOX_SIZE / 2,
    });
  }

  return boxes;
};

export function DependencyStack() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const boxes = useRef(createBoxes()).current;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(
        0,
        Math.min(1, scrollTop / Math.max(docHeight, 1))
      );
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Easing function for smoother animation
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none w-screen h-screen"
      style={{ zIndex: 0 }}
    >
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-600 -400 1200 1400"
        style={{ opacity: 0.12, width: "120vw", height: "120vh" }}
      >
        {/* Bracket at top - fades out as boxes transform */}
        <path
          d={`M -200 -240 
              Q -200 -290 -150 -290
              L 150 -290
              Q 200 -290 200 -240`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-neutral-400"
          style={{
            opacity: 1 - easeInOutCubic(scrollProgress),
          }}
        />

        {boxes.map((box) => {
          const progress = easeInOutCubic(scrollProgress);

          // Interpolate from stack position to grid position
          const currentX = box.stackX + (box.gridX - box.stackX) * progress;
          const currentY = box.stackY + (box.gridY - box.stackY) * progress;

          // Interpolate size from original to uniform
          const currentWidth = box.width + (BOX_SIZE - box.width) * progress;
          const currentHeight = box.height + (BOX_SIZE - box.height) * progress;

          return (
            <rect
              key={box.id}
              x={-currentWidth / 2}
              y={-currentHeight / 2}
              width={currentWidth}
              height={currentHeight}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-neutral-400"
              rx={progress * 6} // Slightly round corners as it becomes a grid
              ry={progress * 6}
              style={{
                transform: `translate(${currentX}px, ${currentY}px)`,
                transformOrigin: "center",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
