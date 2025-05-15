'use client'

import React, { useCallback } from 'react'
import Particles from 'react-tsparticles'
import type { Engine } from 'tsparticles-engine'
import { loadSlim } from 'tsparticles-slim'

const ParticlesBackground: React.FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: unknown) => {
    console.log(container)
  }, [])

  return (
    <div className="h-[90%] w-[60px] overflow-visible">
      <Particles
        id="tsparticles"
        className="h-full"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: {
              value: 30,
              density: {
                enable: true,
                area: 10,
              },
            },
            color: {
              value: '#ffffff',
            },
            shape: {
              type: 'circle',
            },
            opacity: {
              value: 0.75,
              random: true,
            },
            size: {
              value: 1.25,
              random: true,
            },
            move: {
              enable: true,
              speed: 0.55,
              direction: 'bottom',
              outModes: 'out',
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'attract',
              },
              resize: true,
            },
            modes: {
              attract: {
                distance: 120,
              },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  )
}

export default ParticlesBackground

export const ParticlesBento: React.FC = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const particlesLoaded = useCallback(async (container: unknown) => {
    console.log(container)
  }, [])

  return (
    <div className="h-full w-full overflow-visible">
      <Particles
        id="tsparticles-bento"
        className="h-full"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: { enable: false },
          particles: {
            number: {
              value: 20,
              density: {
                enable: true,
                area: 40,
              },
            },
            color: {
              value: '#A9E0FF',
            },
            shape: {
              type: 'circle',
            },
            opacity: {
              value: 0.65,
              random: true,
            },
            size: {
              value: 1.25,
              random: true,
            },
            move: {
              enable: true,
              speed: 0.55,
              direction: 'top',
              outMode: 'out',
            },
          },
          interactivity: {
            events: {
              onHover: {
                enable: true,
                mode: 'grab',
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 40,
              },
            },
          },
          detectRetina: true,
        }}
      />
    </div>
  )
}
