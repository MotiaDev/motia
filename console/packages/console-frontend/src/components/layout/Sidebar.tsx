import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { clsx } from 'clsx'
import {
  ChevronUp,
  Database,
  GitBranch,
  Layers,
  Menu,
  Server,
  Settings,
  Terminal,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { HealthComponent } from '@/api'
import { healthQuery, useConfig } from '@/api'

const BASE_NAV_ITEMS = [
  { name: 'Functions', href: '/functions', icon: Server },
  { name: 'Triggers', href: '/triggers', icon: Zap },
  { name: 'States', href: '/states', icon: Database },
  { name: 'Streams', href: '/streams', icon: Layers },
  { name: 'Traces', href: '/traces', icon: GitBranch },
  { name: 'Logs', href: '/logs', icon: Terminal },
  { name: 'Config', href: '/config', icon: Settings },
]

const FLOW_NAV_ITEM = { name: 'Flow', href: '/flow', icon: Workflow }

function ComponentDetail({ name, details }: { name: string; details: Record<string, unknown> }) {
  switch (name) {
    case 'logs':
      return <>{details.stored_logs ?? 0} stored</>
    case 'metrics':
      return <>{details.stored_metrics ?? 0} stored</>
    case 'spans':
      return <>{details.stored_spans ?? 0} stored</>
    case 'otel': {
      const exporter = String(details.exporter ?? '')
        .replace(/^Some\(/, '')
        .replace(/\)$/, '')
        .toLowerCase()
      return (
        <>
          {exporter} · {String(details.service_name ?? '')}
        </>
      )
    }
    default:
      return null
  }
}

export function Sidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const config = useConfig()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showHealth, setShowHealth] = useState(false)
  const healthPanelRef = useRef<HTMLDivElement>(null)

  const { data: health } = useQuery(healthQuery)
  const isOnline = health?.status === 'healthy'

  const healthyCount = health
    ? Object.values(health.components).filter((c) => c?.status === 'healthy').length
    : 0
  const totalCount = health ? Object.keys(health.components).length : 0

  const navItems = useMemo(() => {
    if (config.enableFlow) {
      return [BASE_NAV_ITEMS[0], FLOW_NAV_ITEM, ...BASE_NAV_ITEMS.slice(1)]
    }
    return BASE_NAV_ITEMS
  }, [config.enableFlow])

  const toggleHealth = useCallback(() => setShowHealth((prev) => !prev), [])

  // Close health panel on click outside
  useEffect(() => {
    if (!showHealth) return
    const handleClick = (e: MouseEvent) => {
      if (healthPanelRef.current && !healthPanelRef.current.contains(e.target as Node)) {
        setShowHealth(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showHealth])

  // Close mobile menu and health panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false)
        setShowHealth(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 md:py-4.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/iii-white1.1.svg" alt="iii logo" className="w-6 h-6" />
          <div className="leading-tight">
            <span className="text-[10px] tracking-[0.15em] text-muted uppercase block">
              Developer
            </span>
            <span className="text-[10px] tracking-[0.15em] text-muted uppercase block">
              Console
            </span>
          </div>
        </div>
        {/* Close button for mobile */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-dark-gray transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 text-xs tracking-wide rounded transition-all duration-150',
                isActive
                  ? 'bg-white text-black font-medium'
                  : 'text-muted hover:text-foreground hover:bg-[#1D1D1D]',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
              <span className="uppercase tracking-wider">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status Footer */}
      <div className="relative p-4 border-t border-border" ref={healthPanelRef}>
        {/* Health Popover */}
        {showHealth && health && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0A0A0A] border border-[#2D2D2D] rounded-lg overflow-hidden animate-panel-in z-50">
            <div className="px-3 py-2 border-b border-[#2D2D2D] flex items-center justify-between">
              <span className="text-[10px] tracking-[0.15em] text-muted uppercase">
                Engine Health
              </span>
              <span className="text-[10px] tracking-wide text-muted/60 font-mono">
                v{health.version}
              </span>
            </div>
            <div className="p-2 space-y-0.5">
              {(Object.entries(health.components) as [string, HealthComponent | undefined][]).map(
                ([name, component]) => {
                  if (!component) return null
                  const isHealthy = component.status === 'healthy'
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#1D1D1D]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            'w-1.5 h-1.5 rounded-full',
                            isHealthy ? 'bg-[#22C55E]' : 'bg-[#EF4444]',
                          )}
                        />
                        <span className="text-[10px] tracking-[0.1em] text-foreground uppercase">
                          {name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted/60 font-mono">
                        <ComponentDetail name={name} details={component.details} />
                      </span>
                    </div>
                  )
                },
              )}
            </div>
          </div>
        )}

        {/* Status Pill */}
        <button
          type="button"
          onClick={toggleHealth}
          className="flex items-center gap-2 cursor-pointer group"
          aria-expanded={showHealth}
          aria-label="Toggle engine health details"
        >
          <div
            className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors',
              isOnline ? 'border-[#22C55E]/50' : 'border-[#EF4444]/50',
              showHealth && 'bg-[#1D1D1D]/50',
            )}
          >
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                isOnline
                  ? 'bg-[#22C55E] shadow-[0_0_6px_#22C55E]'
                  : 'bg-[#EF4444] shadow-[0_0_6px_#EF4444]',
              )}
            />
            <span className="text-[10px] tracking-[0.1em] text-foreground uppercase">
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {health && (
              <span className="text-[10px] text-muted/60 font-mono">
                {healthyCount}/{totalCount}
              </span>
            )}
            <ChevronUp
              className={clsx(
                'w-3 h-3 text-muted/40 transition-transform duration-150',
                !showHealth && 'rotate-180',
              )}
            />
          </div>
        </button>

        <div className="mt-3 text-[9px] text-muted/60 tracking-wide font-mono">
          v{config.version} • {config.engineHost}:{config.enginePort}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-black border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/iii-white1.1.svg" alt="iii logo" className="w-5 h-5" />
          <span className="text-xs tracking-[0.15em] text-muted uppercase">iii Console</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              isOnline
                ? 'bg-[#22C55E] shadow-[0_0_6px_#22C55E]'
                : 'bg-[#EF4444] shadow-[0_0_6px_#EF4444]',
            )}
          />
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-dark-gray transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        // biome-ignore lint/a11y/noStaticElementInteractions: click-away overlay with keyboard support
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          role="presentation"
          onClick={() => setIsMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsMobileMenuOpen(false)
          }}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in drawer */}
      <div
        className={clsx(
          'w-56 h-screen bg-black border-r border-border flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out',
          // Mobile: slide in/out
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
