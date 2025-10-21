// import path from 'path'
// import fs from 'fs'
// import { callStepFile } from '../call-step-file'
// import { createEventManager } from '../event-manager'
// import { LockedData } from '../locked-data'
// import { Logger } from '../logger'
// import { Motia } from '../motia'
// import { NoPrinter } from '../printer'
// import { MemoryStateAdapter } from '../state/adapters/memory-state-adapter'
// import { createApiStep } from './fixtures/step-fixtures'
// import { NoTracer } from '../observability/no-tracer'
// import { spawnSync } from 'child_process'
// import express from 'express'

// describe('callStepFile (large payload via temp file) - Python', () => {
//   const hasPython = spawnSync('python', ['-V']).status === 0
//   const itif = hasPython ? it : it.skip

//   itif('writes large payload to meta.json and cleans temp dir after execution', async () => {
//     const baseDir = path.join(__dirname, 'steps')
//     const eventManager = createEventManager()
//     const state = new MemoryStateAdapter()

//     const step = createApiStep({ emits: [] }, path.join(baseDir, 'large-data-step.py'))
//     const printer = new NoPrinter()
//     const logger = new Logger()
//     const tracer = new NoTracer()

//     const motia: Motia = {
//       eventManager,
//       state,
//       printer,
//       lockedData: new LockedData(baseDir, 'memory', printer),
//       loggerFactory: { create: () => logger },
//       tracerFactory: { createTracer: () => tracer, clear: () => Promise.resolve() },
//       app: express(),
//       stateAdapter: state
//     }

//     const bigData = 'x'.repeat(2 * 1024 * 1024)

//     let metaPath: string | undefined
//     const originalWrite = fs.writeFileSync
//     const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((file: any, data: any, options?: any) => {
//       if (typeof file === 'string' && file.endsWith(path.join('meta.json'))) {
//         metaPath = file
//       }
//       return (originalWrite as any).call(fs, file, data, options)
//     })

//     const result = await callStepFile<number>({ step, traceId: 't', data: bigData, logger, tracer }, motia)

//     // ✅ Ensure meta.json was actually written
//     expect(writeSpy).toHaveBeenCalledWith(
//       expect.stringContaining('meta.json'),
//       expect.any(String),
//       expect.objectContaining({ mode: 0o600 })
//     )

//     // ✅ Ensure the temp directory was deleted
//     if (metaPath) {
//       const dir = path.dirname(metaPath)
//       await new Promise((resolve) => setTimeout(resolve, 100))
//       expect(fs.existsSync(dir)).toBe(false)
//     }

//     writeSpy.mockRestore()
//   }, 30000)
// })
