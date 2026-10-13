'use client'

import { AnimatePresence, motion } from 'motion/react'
import { type RefObject, useLayoutEffect, useRef, useState } from 'react'

import { useGraphicLoop } from '@/components/graphics/use-graphic-loop'
import { Reveal } from '@/components/site/reveal'
import { duration, easeOut } from '@/lib/motion'
import { overview } from './content'
import { AXIS_RATIO, captionFor, OverviewGraph, OverviewStack, useBeat } from './overview-graph'
import { Section } from './section'

/**
 * Overview: four plain paragraphs (Anthony's copy, no labels) beside the whole system as one map: the engine at
 * the centre, real registry workers on a ring around it, each tagged with its language and cloud, and every call
 * drawn caller → engine → callee so the routing is unmistakable.
 */
/** Distance from the top of the document in layout terms: offsets ignore transforms, so the 10px Reveal fade-up and
    any half-finished animation never leak into the measurement. */
const layoutTop = (el: HTMLElement) => {
  let top = 0
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop
  return top
}

/**
 * Pulls the graph up or down so its request → engine axis sits level with the first line of the anchor paragraph.
 * Measured rather than hard-coded because the paragraphs re-wrap with the column width. Each pass works out the
 * graph's natural position (its current top minus the margin already applied) and sets the shift from scratch, so
 * repeated measurements (resize, font load) land on the same value instead of adding up. Desktop only: the phone
 * stack has no axis to line up.
 */
function useAxisAlignment(
  anchorRef: RefObject<HTMLParagraphElement | null>,
  graphRef: RefObject<HTMLDivElement | null>,
) {
  const [shift, setShift] = useState(0)
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const graph = graphRef.current
    if (!anchor || !graph) return
    const measure = () => {
      if (!graph.offsetHeight) return setShift(0)
      const applied = Number.parseFloat(graph.style.marginTop) || 0
      const lineHeight = Number.parseFloat(getComputedStyle(anchor).lineHeight)
      const line = layoutTop(anchor) + lineHeight / 2
      const axis = layoutTop(graph) - applied + graph.offsetHeight * AXIS_RATIO
      setShift(Math.round(line - axis))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(anchor)
    observer.observe(graph)
    document.fonts?.ready.then(measure)
    return () => observer.disconnect()
  }, [anchorRef, graphRef])
  return shift
}

export function Overview() {
  const { ref, active } = useGraphicLoop<HTMLDivElement>()
  const { step, cycle } = useBeat(active)
  const caption = captionFor(step)
  const anchorRef = useRef<HTMLParagraphElement>(null)
  const graphRef = useRef<HTMLDivElement>(null)
  const shift = useAxisAlignment(anchorRef, graphRef)

  return (
    // biome-ignore lint/correctness/useUniqueElementIds: One stable anchor per section on this page.
    <Section id="overview" eyebrow={overview.eyebrow} title={overview.title} lede={overview.subtitle}>
      <div
        ref={ref}
        className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:mt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12"
      >
        <Reveal className="flex min-w-0 max-w-[46ch] flex-col gap-4 lg:pt-4">
          {overview.paragraphs.map((body, i) => (
            <p
              key={body}
              /* The graph's request → engine axis lines up with the third paragraph's first line, the middle of the copy. */
              ref={i === 2 ? anchorRef : undefined}
              className={
                i === overview.paragraphs.length - 1
                  ? 'text-pretty text-[16px] text-foreground leading-[1.55] md:text-[17px]'
                  : 'text-pretty text-[16px] text-muted-foreground leading-[1.55] md:text-[17px]'
              }
            >
              {body}
            </p>
          ))}
        </Reveal>
        <Reveal delay={0.1} className="graphic-stage min-w-0">
          {/* Phones and small laptops get the same graph stacked in HTML; the drawn SVG needs a wide column to stay legible. */}
          <OverviewStack step={step} active={active} className="min-[1400px]:hidden" />
          <div ref={graphRef} className="hidden min-[1400px]:block" style={shift ? { marginTop: shift } : undefined}>
            <OverviewGraph
              step={step}
              cycle={cycle}
              active={active}
              label="A system map: the iii engine at the centre and eight participants on a ring around it, each labelled with where it runs: http in Rust on AWS, database in Rust on GCP, harness in Rust on AWS, llm-router in Rust on Azure, provider-anthropic in Rust on GCP, claude-code in TypeScript on Azure, hermes in Python on AWS, and the incoming request. The workers register one or two at a time, then one request is traced through the system, every call travelling from the caller through the engine to the callee."
            />
          </div>
          <div
            aria-hidden
            className="mt-3 flex h-5 items-center justify-center overflow-hidden text-center font-sans text-[13px] text-muted-foreground"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={caption}
                className="truncate"
                initial={{ opacity: 0, transform: 'translateY(6px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transform: 'translateY(-4px)', transition: { duration: duration.fast } }}
                transition={{ duration: duration.base, ease: easeOut }}
              >
                {caption}
              </motion.span>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </Section>
  )
}
