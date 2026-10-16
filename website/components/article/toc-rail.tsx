'use client'

import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { duration, easeOut, stagger } from '@/lib/motion'
import styles from './article.module.css'

export type TocItem = { id: string; text: string; depth?: 2 | 3 }

export type TocGroup = {
  /** small label over the group; omit on the first group */
  label?: string
  items: TocItem[]
}

/** Headings at or above this line (the floating header plus a little room) count as passed. */
const LINE = 120

/** The rail's column: nodes sit on its centre line, the list text starts to its right. */
const RAIL_X = 10

type Node = { id: string; y: number; depth: 2 | 3 }

/**
 * A contents list beside a long document, drawn as a rail. Every heading is a node on a vertical track; a lit
 * segment runs down the track to the reader's position, interpolated between the headings on either side of it, and
 * a point travels on its leading edge. Passed headings keep their node lit, the current one carries a halo, and the
 * ones still to come stay hollow. The track draws itself in once when the page opens. Everything follows the OS
 * reduced-motion setting: springs become jumps and the halo stops breathing.
 */
export function TocRail({ title = 'On this page', groups }: { title?: string; groups: TocGroup[] }) {
  const key = groups.flatMap((g) => g.items.map((i) => i.id)).join('\n')
  const listRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [percent, setPercent] = useState(0)
  const reduced = useReducedMotion()

  // Where the lit segment ends, in rail pixels. The spring smooths the scroll position into a glide.
  const head = useMotionValue(0)
  const glide = useSpring(
    head,
    reduced ? { stiffness: 1200, damping: 100 } : { stiffness: 140, damping: 26, mass: 0.7 },
  )

  const first = nodes[0]?.y ?? 0
  const last = nodes[nodes.length - 1]?.y ?? 0
  const span = Math.max(1, last - first)
  const lit = useTransform(glide, (y) => Math.min(1, Math.max(0, (y - first) / span)))

  // The list is the measuring stick: each link's centre is a node's y.
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const anchors = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[data-toc-id]'))
      setNodes(
        anchors.map((a) => ({
          id: a.dataset.tocId ?? '',
          y: a.offsetTop + a.offsetHeight / 2,
          depth: a.dataset.depth === '3' ? 3 : 2,
        })),
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!nodes.length) return
    const headings = nodes
      .map((n) => ({ node: n, el: document.getElementById(n.id) }))
      .filter((h): h is { node: Node; el: HTMLElement } => h.el !== null)
    if (!headings.length) return
    let frame = 0
    const pick = () => {
      frame = 0
      const line = window.scrollY + LINE
      const tops = headings.map((h) => h.el.getBoundingClientRect().top + window.scrollY)

      // The current heading: the last one above the line.
      let index = 0
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= line) index = i
        else break
      }
      setActive(headings[index].node.id)

      // The reader's position on the rail: between this heading's node and the next one's.
      const from = headings[index].node.y
      let y = from
      if (tops[index] <= line && index + 1 < tops.length) {
        const t = (line - tops[index]) / Math.max(1, tops[index + 1] - tops[index])
        y = from + Math.min(1, Math.max(0, t)) * (headings[index + 1].node.y - from)
      }
      head.set(y)

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setPercent(scrollable > 0 ? Math.round((100 * window.scrollY) / scrollable) : 100)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(pick)
    }
    pick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [nodes, head])

  // Nodes light as the glide passes them, not on the discrete heading change, so they and the segment agree.
  const [litCount, setLitCount] = useState(0)
  useMotionValueEvent(glide, 'change', (y) => {
    let n = 0
    for (const node of nodes) if (node.y <= y + 1) n++
    setLitCount(n)
  })

  if (!key) return null

  const activeIndex = nodes.findIndex((n) => n.id === active)

  return (
    <nav aria-label={title} className={styles.toc}>
      <p className={styles.tocTitle}>
        <span className={styles.eyebrow}>{title}</span>
        <span className={styles.tocPercent}>
          <span className="sr-only">Read </span>
          {percent}%
        </span>
      </p>
      <div ref={listRef} className={styles.tocList}>
        {nodes.length >= 2 ? (
          <svg className={styles.tocRail} width={RAIL_X * 2} height={last + RAIL_X} aria-hidden="true">
            <motion.path
              className={styles.tocTrack}
              d={`M${RAIL_X} ${first} V${last}`}
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: duration.print, ease: easeOut }}
            />
            <motion.path className={styles.tocLit} d={`M${RAIL_X} ${first} V${last}`} style={{ pathLength: lit }} />
            {nodes.map((node, i) => {
              const size = node.depth === 3 ? 5 : 8
              const state = i === activeIndex ? 'current' : i < litCount ? 'passed' : 'upcoming'
              return (
                <motion.g
                  key={node.id}
                  data-state={state}
                  className={styles.tocNode}
                  initial={reduced ? false : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: duration.base, delay: 0.15 + i * stagger, ease: easeOut }}
                  style={{ transformOrigin: `${RAIL_X}px ${node.y}px` }}
                >
                  <rect
                    className={styles.tocHalo}
                    x={RAIL_X - size / 2 - 5}
                    y={node.y - size / 2 - 5}
                    width={size + 10}
                    height={size + 10}
                    rx={4}
                  />
                  <rect
                    className={styles.tocDot}
                    x={RAIL_X - size / 2}
                    y={node.y - size / 2}
                    width={size}
                    height={size}
                    rx={node.depth === 3 ? 1.5 : 2}
                  />
                </motion.g>
              )
            })}
            <motion.circle className={styles.tocHead} cx={RAIL_X} cy={glide} r={3} />
          </svg>
        ) : null}
        {groups.map((group, gi) => (
          <div key={group.label ?? gi}>
            {group.label ? <p className={styles.tocGroupLabel}>{group.label}</p> : null}
            <ul>
              {group.items.map((item) => {
                const current = item.id === active
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={current ? 'location' : undefined}
                      data-toc-id={item.id}
                      data-depth={item.depth ?? 2}
                      className={styles.tocLink}
                    >
                      {item.text}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
