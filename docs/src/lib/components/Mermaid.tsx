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

  useEffect(() => {
    if (!mounted) return

    const updateTheme = () => {
      const isDark = resolvedTheme === 'dark' || (!resolvedTheme && document.documentElement.classList.contains('dark'))
      setThemeState(isDark ? 'dark' : 'light')
    }

    updateTheme()

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
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 14,
        theme: isDark ? 'dark' : 'default',
        flowchart: {
          useMaxWidth: true,
          padding: 16,
          nodeSpacing: 30,
          rankSpacing: 40,
        },
        sequence: {
          useMaxWidth: false,
          boxMargin: 8,
          boxTextMargin: 8,
        },
      })

      const { svg } = await mermaid.render(`mermaid-${id}-${Date.now()}`, chart.replaceAll('\\n', '\n'))

      containerRef.current.innerHTML = svg

      const svgElement = containerRef.current.querySelector('svg')
      if (svgElement) {
        const naturalWidth = parseFloat(svgElement.getAttribute('width') || '0')
        const naturalHeight = parseFloat(svgElement.getAttribute('height') || '0')

        if (naturalWidth > 0 && naturalHeight > 0) {
          svgElement.setAttribute('viewBox', `0 0 ${naturalWidth} ${naturalHeight}`)
        }

        svgElement.setAttribute('width', '100%')
        svgElement.removeAttribute('height')
        svgElement.style.maxWidth = '100%'
        svgElement.style.height = 'auto'

        const style = getComputedStyle(document.documentElement)
        const fillColor = style.getPropertyValue('--color-mermaid-fill').trim()
        const strokeColor = style.getPropertyValue('--color-mermaid-stroke').trim()
        const textColor = style.getPropertyValue('--color-mermaid-text').trim()
        const clusterFill = style.getPropertyValue('--color-mermaid-cluster-fill').trim()

        svgElement.querySelectorAll('rect').forEach((el) => {
          const svgEl = el as SVGElement

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
            svgEl.setAttribute('fill', fillColor)
            svgEl.setAttribute('stroke', strokeColor)
            svgEl.setAttribute('stroke-width', '2')
            ;(svgEl as unknown as HTMLElement).style.cssText =
              `fill: ${fillColor} !important; stroke: ${strokeColor} !important; stroke-width: 2px !important;`
          }
        })

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

        svgElement.querySelectorAll('path, line, polyline').forEach((el) => {
          const svgEl = el as SVGElement
          svgEl.setAttribute('stroke', strokeColor)
          svgEl.setAttribute('stroke-width', '2')
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `stroke: ${strokeColor} !important; stroke-width: 2px !important; fill: none !important;`
        })

        svgElement.querySelectorAll('text, tspan, .nodeLabel, .edgeLabel').forEach((el) => {
          const svgEl = el as SVGElement
          svgEl.setAttribute('fill', textColor)
          svgEl.setAttribute('color', textColor)
          ;(svgEl as unknown as HTMLElement).style.cssText =
            `fill: ${textColor} !important; color: ${textColor} !important;`
        })

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

  return <div ref={containerRef} className="mermaid my-6" />
}
