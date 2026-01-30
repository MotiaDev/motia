'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useRef, useState } from 'react'

export function Mermaid({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [themeState, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Watch for theme changes via MutationObserver
  useEffect(() => {
    if (!mounted) return

    const updateTheme = () => {
      const isDark = resolvedTheme === 'dark' || (!resolvedTheme && document.documentElement.classList.contains('dark'))
      setThemeState(isDark ? 'dark' : 'light')
    }

    // Set initial theme
    updateTheme()

    // Watch for class changes on html element
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [mounted, resolvedTheme])

  useEffect(() => {
    async function renderDiagram() {
      if (!containerRef.current || !mounted) return

      const isDark = themeState === 'dark'

      const mermaid = (await import('mermaid')).default

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        fontFamily: 'inherit',
        theme: isDark ? 'dark' : 'default',
      })

      const { svg } = await mermaid.render(`mermaid-${id}-${Date.now()}`, chart.replaceAll('\\n', '\n'))

      containerRef.current.innerHTML = svg

      const svgElement = containerRef.current.querySelector('svg')
      if (svgElement) {
        // Read colors from CSS variables
        const style = getComputedStyle(document.documentElement)
        const fillColor = style.getPropertyValue('--color-mermaid-fill').trim()
        const strokeColor = style.getPropertyValue('--color-mermaid-stroke').trim()
        const textColor = style.getPropertyValue('--color-mermaid-text').trim()
        const clusterFill = style.getPropertyValue('--color-mermaid-cluster-fill').trim()

        // Update all rects
        svgElement.querySelectorAll('rect').forEach((el) => {
          const svgEl = el as SVGElement

          // Check various class names that might indicate clusters
          const isCluster =
            el.classList.contains('cluster') ||
            el.classList.contains('cluster-rect') ||
            el.parentElement?.classList.contains('cluster')

          if (isCluster) {
            svgEl.setAttribute('fill', clusterFill)
            svgEl.setAttribute('stroke', strokeColor)
            svgEl.setAttribute('stroke-width', '2')
            svgEl.setAttribute('stroke-dasharray', '5 5')
            ;(svgEl as unknown as HTMLElement).style.cssText =
              `fill: ${clusterFill} !important; stroke: ${strokeColor} !important; stroke-width: 2px !important; stroke-dasharray: 5 5 !important;`
          } else {
            // Regular boxes - force the fill
            svgEl.setAttribute('fill', fillColor)
            svgEl.setAttribute('stroke', strokeColor)
            svgEl.setAttribute('stroke-width', '2')
            ;(svgEl as unknown as HTMLElement).style.cssText =
              `fill: ${fillColor} !important; stroke: ${strokeColor} !important; stroke-width: 2px !important;`
          }
        })

        // Update polygons, circles, ellipses
        svgElement.querySelectorAll('polygon, circle, ellipse').forEach((el) => {
          const svgEl = el as SVGElement

          if (svgEl.getAttribute('fill') !== 'none') {
            svgEl.setAttribute('fill', fillColor)
          }
          svgEl.setAttribute('stroke', strokeColor)
          svgEl.setAttribute('stroke-width', '2')
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `fill: ${fillColor} !important; stroke: ${strokeColor} !important; stroke-width: 2px !important;`
        })

        // Update all paths and lines
        svgElement.querySelectorAll('path, line, polyline').forEach((el) => {
          const svgEl = el as SVGElement
          svgEl.setAttribute('stroke', strokeColor)
          svgEl.setAttribute('stroke-width', '2')
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `stroke: ${strokeColor} !important; stroke-width: 2px !important; fill: none !important;`
        })

        // Update text - be more aggressive
        svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel').forEach((el) => {
          const svgEl = el as SVGElement
          svgEl.setAttribute('fill', textColor)
          svgEl.setAttribute('color', textColor)
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `fill: ${textColor} !important; color: ${textColor} !important;`
        })

        // Update markers (arrowheads)
        svgElement.querySelectorAll('marker path, marker polygon').forEach((el) => {
          const svgEl = el as SVGElement
          svgEl.setAttribute('fill', strokeColor)
          svgEl.setAttribute('stroke', strokeColor)
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `fill: ${strokeColor} !important; stroke: ${strokeColor} !important;`
        })
      }
    }

    renderDiagram()
  }, [chart, id, themeState, mounted])

  return <div ref={containerRef} className="mermaid my-6 flex justify-center" />
}
