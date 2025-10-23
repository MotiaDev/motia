/// <reference types="vite/client" />

declare module 'virtual:motia-plugins' {
  export interface MotiaPlugin {
    position: 'top' | 'bottom'
    label: string
    props: Record<string, any>
    labelIcon: string
    component: React.ComponentType<any>
  }

  export const plugins: MotiaPlugin[]
}

// This is injected by the middleware: check middleware.ts
declare const workbenchBase: string
