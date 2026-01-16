import { useEffect, useState, useRef } from "react";

interface Box {
  id: number;
  width: number;
  height: number;
  // Position in the xkcd dependency stack (center point for rendering)
  stackX: number;
  stackY: number;
  // Position in the uniform grid (center point)
  gridX: number;
  gridY: number;
}

// Grid configuration for the final uniform square
const GRID_SIZE = 6; // 6x6 grid = 36 boxes
const BOX_SIZE = 70;
const BOX_GAP = 12;

// Variant configurations
export type DependencyStackVariant = "fullscreen" | "corner" | "splash";

interface DependencyStackProps {
  /** Visual variant of the component */
  variant?: DependencyStackVariant;
  /** Override opacity (0-1) */
  opacity?: number;
  /** Custom class name for the container */
  className?: string;
  /** Whether to animate based on scroll (true) or use fixed progress */
  animateOnScroll?: boolean;
  /** Fixed progress value (0-1) when animateOnScroll is false */
  progress?: number;
  /** Show the bracket at top */
  showBracket?: boolean;
  /** Scale multiplier for the entire visualization */
  scale?: number;
}

// Create boxes that form the dependency stack, then rearrange into a grid
// Using BOTTOM-LEFT positioning: (left, bottom) with width extending right, height extending UP
// In SVG, Y increases downward, so "up" means smaller Y values
// bottom = Y coordinate of bottom edge, top = bottom - height
const createBoxes = (): Box[] => {
  const boxes: Box[] = [];

  // Ground level (bottom of the structure)
  const GROUND = 360;

  // Positions use: left (x of left edge), bottom (y of bottom edge), w (width), h (height)
  // Block stacks upward, so top of block = bottom - height
  const stackPositions = [
    // === BOTTOM BASE PLATFORMS (3 wide horizontal layers) ===
    // Ground level platform
    { left: -170, bottom: GROUND, w: 340, h: 28 },
    // Stacks on top: bottom = previous.bottom - previous.h
    { left: -150, bottom: GROUND - 28, w: 300, h: 26 },
    { left: -130, bottom: GROUND - 28 - 26, w: 260, h: 24 },

    // === PEDESTAL ===
    { left: -70, bottom: GROUND - 28 - 26 - 24, w: 140, h: 30 },

    // === MAIN FOUNDATION BLOCK (large) — BELOW NEBRASKA ===
    { left: -100, bottom: GROUND - 28 - 26 - 24 - 30, w: 200, h: 110 },
    // Top of this block = 360 - 28 - 26 - 24 - 30 - 110 = 142

    // === THE CRITICAL "NEBRASKA" BLOCK (tall and skinny) ===
    // Rests on top of foundation block, so bottom = 142
    { left: 10, bottom: 142, w: 28, h: 55 },
    // Top of Nebraska = 142 - 55 = 87

    // === COMPANION BLOCK (to the left of Nebraska, same level) ===
    { left: -55, bottom: 142, w: 35, h: 55 },

    // === MIDDLE SUPPORT LAYER — ABOVE NEBRASKA ===
    // This wide block rests on Nebraska and companion (and hangs over edges)
    { left: -85, bottom: 87, w: 175, h: 50 },
    // Top = 87 - 50 = 37

    // === SECOND MIDDLE LAYER ===
    { left: -70, bottom: 37, w: 145, h: 42 },
    // Top = 37 - 42 = -5

    // === LEFT TOWER (stacked vertically) ===
    { left: -90, bottom: -5, w: 42, h: 52 },
    { left: -88, bottom: -57, w: 36, h: 46 },
    { left: -84, bottom: -103, w: 30, h: 40 },
    { left: -82, bottom: -143, w: 26, h: 34 },
    { left: -80, bottom: -177, w: 22, h: 28 },
    { left: -78, bottom: -205, w: 18, h: 24 },

    // === MIDDLE TOWER (tallest) ===
    { left: -24, bottom: -5, w: 52, h: 65 },
    { left: -20, bottom: -70, w: 45, h: 55 },
    { left: -18, bottom: -125, w: 40, h: 50 },
    { left: -15, bottom: -175, w: 34, h: 45 },
    { left: -12, bottom: -220, w: 28, h: 40 },
    { left: -10, bottom: -260, w: 24, h: 35 },
    { left: -8, bottom: -295, w: 20, h: 30 },

    // === RIGHT TOWER ===
    { left: 50, bottom: -5, w: 48, h: 58 },
    { left: 54, bottom: -63, w: 42, h: 52 },
    { left: 56, bottom: -115, w: 36, h: 46 },
    { left: 58, bottom: -161, w: 30, h: 40 },
    { left: 60, bottom: -201, w: 26, h: 34 },

    // === SMALL TOP BLOCKS ===
    { left: -76, bottom: -229, w: 16, h: 20 },
    { left: -74, bottom: -249, w: 14, h: 18 },
    { left: -6, bottom: -325, w: 18, h: 26 },
    { left: -5, bottom: -351, w: 14, h: 22 },
    { left: 62, bottom: -235, w: 22, h: 28 },
    { left: 64, bottom: -263, w: 18, h: 24 },

    // === TINY ACCENT BLOCKS ===
    { left: -72, bottom: -267, w: 12, h: 14 },
    { left: -4, bottom: -373, w: 12, h: 18 },
    { left: 66, bottom: -287, w: 14, h: 20 },
  ];

  // Calculate grid positions for uniform square (grid uses center positioning)
  const totalGridWidth = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const totalGridHeight = GRID_SIZE * BOX_SIZE + (GRID_SIZE - 1) * BOX_GAP;
  const gridStartX = -totalGridWidth / 2;
  const gridStartY = -totalGridHeight / 2;

  for (let i = 0; i < stackPositions.length; i++) {
    const stack = stackPositions[i];
    const gridRow = Math.floor(i / GRID_SIZE);
    const gridCol = i % GRID_SIZE;

    // Convert bottom-left to center for consistent rendering
    const centerX = stack.left + stack.w / 2;
    const centerY = stack.bottom - stack.h / 2; // center Y (remember: up is negative)

    boxes.push({
      id: i,
      width: stack.w,
      height: stack.h,
      stackX: centerX,
      stackY: centerY,
      gridX: gridStartX + gridCol * (BOX_SIZE + BOX_GAP) + BOX_SIZE / 2,
      gridY: gridStartY + gridRow * (BOX_SIZE + BOX_GAP) + BOX_SIZE / 2,
    });
  }

  return boxes;
};

// Variant style configurations
const variantStyles: Record<
  DependencyStackVariant,
  {
    containerClass: string;
    svgClass: string;
    svgStyle: React.CSSProperties;
    defaultOpacity: number;
    defaultShowBracket: boolean;
  }
> = {
  fullscreen: {
    containerClass: "fixed inset-0 w-screen h-screen",
    svgClass: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    svgStyle: { width: "100vw", height: "100vh" },
    defaultOpacity: 0.15,
    defaultShowBracket: true,
  },
  corner: {
    containerClass: "fixed bottom-0 right-0 w-[35vw] h-[50vh]",
    svgClass: "w-full h-full",
    svgStyle: {},
    defaultOpacity: 0.25,
    defaultShowBracket: false,
  },
  splash: {
    containerClass: "relative w-full h-full min-h-[400px]",
    svgClass: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    svgStyle: {
      width: "100%",
      height: "100%",
      maxWidth: "800px",
      maxHeight: "800px",
    },
    defaultOpacity: 0.25,
    defaultShowBracket: true,
  },
};

// Easing function for smoother animation
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export function DependencyStack({
  variant = "fullscreen",
  opacity,
  className = "",
  animateOnScroll = true,
  progress: fixedProgress = 0,
  showBracket,
  scale = 1,
}: DependencyStackProps) {
  const [scrollProgress, setScrollProgress] = useState(fixedProgress);
  const containerRef = useRef<HTMLDivElement>(null);
  const boxes = useRef(createBoxes()).current;

  const styles = variantStyles[variant];
  const finalOpacity = opacity ?? styles.defaultOpacity;
  const finalShowBracket = showBracket ?? styles.defaultShowBracket;

  useEffect(() => {
    if (!animateOnScroll) {
      setScrollProgress(fixedProgress);
      return;
    }

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
  }, [animateOnScroll, fixedProgress]);

  // Update progress when fixedProgress prop changes
  useEffect(() => {
    if (!animateOnScroll) {
      setScrollProgress(fixedProgress);
    }
  }, [fixedProgress, animateOnScroll]);

  const progress = easeInOutCubic(scrollProgress);

  // Calculate viewBox based on scale and variant
  // For corner variant, shift viewBox so the base of the structure aligns to bottom-left
  const baseViewBox =
    variant === "corner"
      ? { x: -200, y: -420, w: 400, h: 820 } // Tighter crop, structure at left
      : { x: -250, y: -420, w: 500, h: 820 };
  const scaledViewBox = {
    x: baseViewBox.x / scale,
    y: baseViewBox.y / scale,
    w: baseViewBox.w / scale,
    h: baseViewBox.h / scale,
  };
  const viewBox = `${scaledViewBox.x} ${scaledViewBox.y} ${scaledViewBox.w} ${scaledViewBox.h}`;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden pointer-events-none ${styles.containerClass} ${className}`}
      style={{ zIndex: 0 }}
    >
      <svg
        className={styles.svgClass}
        preserveAspectRatio={
          variant === "corner" ? "xMaxYMax meet" : "xMidYMid meet"
        }
        viewBox={viewBox}
        style={{ ...styles.svgStyle, opacity: finalOpacity }}
      >
        {/* Bracket at top - fades out as boxes transform */}
        {finalShowBracket && (
          <path
            d={`M -80 -400 
                Q -80 -415 -50 -415
                L 50 -415
                Q 80 -415 80 -400`}
            fill="none"
            stroke="currentColor"
            strokeWidth={3 / scale}
            className="text-neutral-300"
            style={{
              opacity: 1 - progress,
            }}
          />
        )}

        {boxes.map((box) => {
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
              strokeWidth={(isNebraskaBlock ? 1.5 : 1) / scale}
              className={isNebraskaBlock ? "" : "text-neutral-300"}
              rx={(progress * 6) / scale}
              ry={(progress * 6) / scale}
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

// Pre-configured variants for easy use

/** Full-screen background that animates on scroll */
export function DependencyStackBackground(
  props: Omit<DependencyStackProps, "variant">
) {
  return <DependencyStack variant="fullscreen" {...props} />;
}

/** Small corner decoration in bottom-left */
export function DependencyStackCorner(
  props: Omit<DependencyStackProps, "variant">
) {
  return <DependencyStack variant="corner" scale={0.6} {...props} />;
}

/** Centered splash/hero element */
export function DependencyStackSplash(
  props: Omit<DependencyStackProps, "variant">
) {
  return <DependencyStack variant="splash" {...props} />;
}
