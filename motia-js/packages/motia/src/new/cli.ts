import { Command } from 'commander'
import { build } from './build/build'
import { dev } from './build/dev'
import { typegen } from './build/typegen'
import { create } from './create'

const program = new Command()

program
  .command('dev')
  .description('Build the project for development')
  .action(() => {
    dev().catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
  })

program
  .command('build')
  .description('Build the project for production')
  .option('-e, --external <external>', 'External dependencies')
  .action((options) => {
    const external = options.external ? options.external.split(',') : []

    build({ external }).catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
  })

program
  .command('typegen')
  .description('Generate TypeScript types from steps and streams')
  .option('-w, --watch', 'Watch for file changes')
  .option('-o, --output <path>', 'Output file path', 'types.d.ts')
  .action((options) => {
    typegen(options).catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
  })

program
  .command('create')
  .description('Create a new Motia project powered by iii')
  .action(() => {
    create().catch((err) => {
      console.error(err)
      process.exitCode = 1
    })
  })

program.parse(process.argv)
