/**
 * Utility functions for getting CSS variable values
 * This allows you to use CSS variables in JavaScript for dynamic styling
 */

/**
 * Get the computed value of a CSS variable
 * @param variableName - The CSS variable name (with or without --)
 * @param element - The element to get the computed style from (defaults to document.documentElement)
 * @returns The computed value of the CSS variable
 */
export function getCSSVariable(variableName: string, element: HTMLElement = document.documentElement): string {
  const varName = variableName.startsWith('--') ? variableName : `--${variableName}`;
  return getComputedStyle(element).getPropertyValue(varName).trim();
}

/**
 * Get all SVG-related CSS variables
 * @returns An object containing all SVG color variables
 */
export function getSVGColors() {
  return {
    fill: getCSSVariable('svg-fill'),
    stroke: getCSSVariable('svg-stroke'),
    text: getCSSVariable('svg-text'),
    clusterFill: getCSSVariable('svg-cluster-fill'),
  };
}

/**
 * Apply CSS variables to an SVG element
 * @param svgElement - The SVG element to style
 * @param colors - Optional specific colors to use, otherwise uses CSS variables
 */
export function applySVGColors(svgElement: SVGElement | null, colors?: ReturnType<typeof getSVGColors>) {
  if (!svgElement) return;

  const svgColors = colors || getSVGColors();

  // Apply fill color to elements
  const fillElements = svgElement.querySelectorAll('[fill]:not([fill="none"])');
  fillElements.forEach((el) => {
    (el as SVGElement).style.fill = svgColors.fill;
  });

  // Apply stroke color to elements
  const strokeElements = svgElement.querySelectorAll('[stroke]:not([stroke="none"])');
  strokeElements.forEach((el) => {
    (el as SVGElement).style.stroke = svgColors.stroke;
  });

  // Apply text color to text elements
  const textElements = svgElement.querySelectorAll('text, tspan');
  textElements.forEach((el) => {
    (el as SVGElement).style.fill = svgColors.text;
  });

  // Apply cluster fill (if you have cluster elements)
  const clusterElements = svgElement.querySelectorAll('.cluster, [data-cluster]');
  clusterElements.forEach((el) => {
    (el as SVGElement).style.fill = svgColors.clusterFill;
  });
}

/**
 * Example usage in your component:
 *
 * ```typescript
 * import { applySVGColors, getSVGColors } from './lib/cssVariables';
 *
 * // In your useEffect or handler:
 * const svgElement = document.querySelector('svg');
 * applySVGColors(svgElement);
 *
 * // Or get colors directly:
 * const colors = getSVGColors();
 * console.log(colors.fill); // Gets the current --svg-fill value
 * ```
 *
 * Instead of:
 * ```typescript
 * const fillColor = isDark ? '#000000' : '#f4f4f4';
 * const strokeColor = isDark ? '#ffffff' : '#000000';
 * const textColor = isDark ? '#ffffff' : '#000000';
 * const clusterFill = isDark ? 'transparent' : '#F4F4F4';
 * ```
 */
