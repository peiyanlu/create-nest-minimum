import { red } from 'ansis'
import { program } from 'commander'
import { readFileSync } from 'node:fs'
import { join } from 'path'
import { Action } from './action.js'
import { __dirname } from './utils.js'


const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

program
  .name(pkg.name)
  .description('Generate Nest minimum application.')
  .version(pkg.version, '-v, --version', 'Output the current version.')
  .usage('[DIRECTORY] [OPTION]...')
  .argument('[name]')
  .option('-d, --dry-run', 'Report actions that would be performed without writing out results.', false)
  .option('-o, --overwrite', 'When the target directory is not empty, the contents will be overwritten.', false)
  .option('-a, --all', 'Skip prompts and use default recommended settings.', false)
  .action(async (argName: string, options: Record<string, boolean>) => {
    await new Action().handle(argName, options)
  })
  .helpOption('-h, --help', 'Output usage information.')
  .parse(process.argv)


program.on('command:*', () => {
  console.error(`\n${ red`Error` } Invalid command: ${ red`%s` }`, program.args.join(' '))
  console.log(`See ${ red`--help` } for a list of available commands.\n`)
  process.exit(1)
})
