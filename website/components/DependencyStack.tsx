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
const GRID_SIZE = 6; // 6x6 grid = 36 boxes
const BOX_SIZE = 70;
const BOX_GAP = 12;

// Create boxes that form the dependency stack, then rearrange into a grid
// Y coordinates: positive = down, negative = up (SVG standard)
// The structure is centered at x=0, with base around y=300 and top around y=-200
const createBoxes = (): Box[] => {
  const boxes: Box[] = [];

  const stackPositions = [
    // === BOTTOM BASE PLATFORMS (3 wide horizontal layers) ===
    { x: 0, y: 340, w: 340, h: 28 }, // Widest base
    { x: 0, y: 308, w: 300, h: 26 }, // Second base
    { x: 0, y: 278, w: 260, h: 24 }, // Third base

    // === PEDESTAL ===
    { x: 0, y: 248, w: 140, h: 28 },

    // === MAIN FOUNDATION BLOCK (large square-ish) — BELOW NEBRASKA ===
    { x: 0, y: 185, w: 200, h: 115 },

    // === THE CRITICAL "NEBRASKA" BLOCK (tall and skinny) ===
    { x: 25, y: 108, w: 28, h: 50 },

    // === MIDDLE SUPPORT LAYERS — ABOVE NEBRASKA ===
    { x: 10, y: 72, w: 175, h: 50 }, // <-- First block resting on Nebraska
    { x: -5, y: 25, w: 145, h: 45 },

    // === LEFT TOWER (stacked vertically) ===
    { x: -68, y: -25, w: 42, h: 52 },
    { x: -70, y: -75, w: 36, h: 46 },
    { x: -66, y: -118, w: 30, h: 40 },
    { x: -68, y: -155, w: 26, h: 34 },
    { x: -66, y: -185, w: 22, h: 28 },
    { x: -67, y: -210, w: 18, h: 24 },

    // === MIDDLE TOWER (tallest) ===
    { x: 5, y: -30, w: 52, h: 62 },
    { x: 7, y: -88, w: 45, h: 55 },
    { x: 4, y: -140, w: 40, h: 50 },
    { x: 6, y: -185, w: 34, h: 42 },
    { x: 4, y: -224, w: 28, h: 36 },
    { x: 5, y: -258, w: 24, h: 32 },
    { x: 4, y: -288, w: 20, h: 28 },

    // === RIGHT TOWER ===
    { x: 72, y: -28, w: 48, h: 58 },
    { x: 75, y: -82, w: 42, h: 50 },
    { x: 72, y: -128, w: 36, h: 44 },
    { x: 74, y: -168, w: 30, h: 36 },
    { x: 72, y: -202, w: 26, h: 32 },

    // === SMALL TOP BLOCKS ===
    { x: -64, y: -232, w: 16, h: 20 },
    { x: -66, y: -252, w: 14, h: 18 },
    { x: 6, y: -314, w: 18, h: 24 },
    { x: 4, y: -338, w: 14, h: 20 },
    { x: 74, y: -230, w: 22, h: 26 },
    { x: 72, y: -256, w: 18, h: 22 },

    // === TINY ACCENT BLOCKS ===
    { x: -62, y: -268, w: 12, h: 14 },
    { x: 5, y: -356, w: 12, h: 14 },
    { x: 76, y: -276, w: 14, h: 18 },
  ];

  // Calculate grid positions for uniform square
  const totalGridWidth = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const totalGridHeight = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const gridStartX = -totalGridWidth / 2;
  const gridStartY = -totalGridHeight / 2; // Centered in view

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
        viewBox="-300 -400 600 800"
        style={{ opacity: 0.15, width: "100vw", height: "100vh" }}
      >
        {/* Bracket at top - fades out as boxes transform */}
        <path
          d={`M -100 -380 
              Q -100 -400 -70 -400
              L 70 -400
              Q 100 -400 100 -380`}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-neutral-300"
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

          // Nebraska block (id 5) gets the alert/error color
          const isNebraskaBlock = box.id === 5;
          const strokeColor = isNebraskaBlock ? "#e52e61" : "currentColor";
          const fillColor = isNebraskaBlock ? "#e52e61" : "none";

          return (
            <rect
              key={box.id}
              x={-currentWidth / 2}
              y={-currentHeight / 2}
              width={currentWidth}
              height={currentHeight}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isNebraskaBlock ? 3 : 2.5}
              className={isNebraskaBlock ? "" : "text-neutral-300"}
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
