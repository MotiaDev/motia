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

// describe('callStepFile (large payload via temp file) - Ruby', () => {
//   const hasRuby = spawnSync('ruby', ['-v']).status === 0
//   const itif = hasRuby ? it : it.skip

//   itif('handles >1MB payload via meta file and returns size', async () => {
//     const baseDir = path.join(__dirname, 'steps')
//     const eventManager = createEventManager()
//     const state = new MemoryStateAdapter()

//     const step = createApiStep({ emits: [] }, path.join(baseDir, 'large-data-step.rb'))
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

//     expect(result).toBe(bigData.length)

//     if (metaPath) {
//       const dir = path.dirname(metaPath)
//       expect(fs.existsSync(dir)).toBe(false)
//     }

//     writeSpy.mockRestore()
//   }, 30000)
// })
