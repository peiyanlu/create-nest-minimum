import { cancel, confirm, intro, isCancel, outro, select, tasks, text } from '@clack/prompts'
import {
  checkVersion,
  copyDirAsync,
  editFile,
  editJsonFile,
  emptyDir,
  execAsync,
  isEmpty,
  isGitRepo,
  isValidPackageName,
  PkgManager,
  toValidPackageName,
  toValidProjectName,
  YesOrNo,
} from '@peiyanlu/cli-tools'
import { cyan, gray } from 'ansis'
import { existsSync } from 'node:fs'
import { basename, relative, resolve } from 'node:path'
import { scheduler } from 'node:timers/promises'
import { Context } from './context.js'
import { MESSAGES } from './messages.js'
import { __dirname } from './utils.js'


export enum HttpLibrary {
  EXPRESS = 'express',
  FASTIFY = 'fastify',
}

export interface PromptsResult {
  targetDir: string;
  packageName: string;
  description: string;
  pkgManager: PkgManager;
  httpLib: HttpLibrary;
  useVitest: boolean;
  useSwc: boolean;
  useCli: boolean;
  useGit: boolean;
}


const renameFiles: Record<string, string> = {
  _gitignore: '.gitignore',
  [`${ HttpLibrary.EXPRESS }.ts`]: 'main.ts',
  [`${ HttpLibrary.FASTIFY }.ts`]: 'main.ts',
}

const pnpmFiles: string[] = [
  'pnpm-workspace.yaml',
]

const reverseFiles = {
  [HttpLibrary.FASTIFY]: HttpLibrary.EXPRESS,
  [HttpLibrary.EXPRESS]: HttpLibrary.FASTIFY,
}


const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel(MESSAGES.OPERATION_ABORTED)
    process.exit(0)
  }
}

const handleDirConflict = async (targetDir: string, options: Record<string, boolean>): Promise<void> => {
  const isExists = existsSync(targetDir)
  const ignore = [ '.git', '.idea', '.vscode' ]
  if (isExists && !await isEmpty(targetDir, ignore)) {
    const overwrite = options.overwrite
      ? YesOrNo.Yes
      : await select({
        message: MESSAGES.DIRECTORY_CONFLICT_QUESTION(targetDir),
        options: [
          {
            label: 'Cancel',
            value: YesOrNo.No,
            hint: 'cancel and exit',
          },
          {
            label: 'Remove',
            value: YesOrNo.Yes,
            hint: 'remove files and continue',
          },
          {
            label: 'Ignore',
            value: YesOrNo.Ignore,
            hint: 'ignore files and continue',
          },
        ],
      })
    assertPrompt(overwrite)
    switch (overwrite) {
      case YesOrNo.Yes:
        await emptyDir(targetDir, ignore)
        break
      case YesOrNo.No:
        outro(MESSAGES.OPERATION_ABORTED)
        process.exit(0)
    }
  }
}

const defaultProjectName = 'nest-minimum-app'
export const createDefaultConfig = (): PromptsResult => ({
  targetDir: defaultProjectName,
  packageName: defaultProjectName,
  description: 'Nest Minimum Application.',
  pkgManager: PkgManager.NPM,
  httpLib: HttpLibrary.EXPRESS,
  useVitest: true,
  useSwc: true,
  useCli: true,
  useGit: true,
})

export class Action {
  public async handle(cmdArgs: string | undefined, options: Record<string, boolean>): Promise<void> {
    intro(cyan('create-nest-minimum-app'))
    
    const ctx = new Context(createDefaultConfig())
    const config = await this.handlePrompts(cmdArgs, options)
    const { targetDir, packageName, description, pkgManager, httpLib, useSwc, useCli, useVitest, useGit } = config
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    const cwd: string = process.cwd()
    const source = resolve(__dirname, '..', 'template')
    const target = resolve(cwd, targetDir)
    
    const isPnpm = pkgManager === PkgManager.PNPM
    const mustSwc = useSwc || useVitest
    
    await tasks([
      {
        title: MESSAGES.PROJECT_INFORMATION_START,
        task: async () => {
          await copyDirAsync(source, target, {
            rename: { ...renameFiles },
            skips: [
              // Framework
              (name, isDir) => !isDir && name === `${ reverseFiles[httpLib] }.ts`,
              
              // Vitest
              (name: string) => !useVitest && [
                /(^|[\\/])(test|tests|__tests__|e2e)([\\/]|$)/,
                /\.(e2e-)?(test|spec)\.m?(ts|js)$/,
                /^vitest([-|.])(.*)\.m?(ts|js)$/,
              ].some(reg => reg.test(name)),
              
              // pnpm
              (name: string) => !isPnpm && pnpmFiles.includes(name),
            ],
          })
          await scheduler.yield()
          
          // -----------------------------------------------------
          process.chdir(targetDir)
          await scheduler.yield()
          
          // -----------------------------------------------------
          if (mustSwc) {
            await editJsonFile('./nest-cli.json', (json) => {
              json.generateOptions.spec = useVitest
              if (useSwc) {
                json.compilerOptions = {
                  builder: 'swc',
                  typeCheck: true,
                  ...json.compilerOptions,
                }
              }
            })
          }
          await editFile('./README.md', content => {
            const isYarn = pkgManager === PkgManager.YARN
            return content
              .replace(/\$PACKAGE_NAME/g, packageName)
              .replace(/\$DESCRIPTION/g, description)
              .replace(/\$INSTALL/g, isYarn ? PkgManager.YARN : `${ pkgManager } install`)
              .replace(/\$RUN/g, isYarn ? PkgManager.YARN : `${ pkgManager } run`)
              .replace(/\$START([\s\S]*?)\$END/g, (_, $1) => useVitest ? $1 : '')
              .replace(/(\r?\n){3,}/g, '\r\n'.repeat(2))
          })
          
          await scheduler.yield()
          
          // -----------------------------------------------------
          ctx.removeDeps([ `@nestjs/platform-${ reverseFiles[httpLib] }` ])
          
          const swcDeps = [ '@swc/cli', '@swc/core' ]
          const cliDeps = [ '@nestjs/cli' ]
          ctx.removeDevDeps(mustSwc
            ? []
            : useCli
              ? swcDeps
              : [ ...swcDeps, ...cliDeps ])
          
          // -----------------------------------------------------
          if (!useVitest) {
            ctx.removeDevDeps([
              'vitest',
              '@vitest/coverage-v8',
              'unplugin-swc',
              '@nestjs/testing',
              'supertest',
              '@types/supertest',
            ])
          }
          if (useVitest) {
            ctx.setScripts({
              'test': 'vitest run',
              'test:e2e': 'vitest run -c vitest.config.e2e.mts',
              'test:cov': 'vitest run --coverage',
            })
            
            // renovate: datasource=npm depName=vitest
            const rVersion = '3.0.8'
          }
          
          // -----------------------------------------------------
          await ctx.applyChanges()
          
          const cmdArr = [
            `npm pkg set name="${ packageName }" description="${ description }"`,
          ]
          if (useGit) {
            const git = [
              'git init',
              'git branch -M master',
            ]
            cmdArr.push(...git)
          }
          
          for (const cmd of cmdArr) {
            await execAsync(cmd)
            await scheduler.yield()
          }
          
          return MESSAGES.PROJECT_INFORMATION_END
        },
      },
    ])
    
    let doneMessage = '🎉  Done. Now run:\n'
    const cdProjectName = relative(cwd, target)
    const prefix = `\n  ${ gray('$') }`
    if (target !== cwd) {
      const dir = cdProjectName.includes(' ') ? `"${ cdProjectName }"` : cdProjectName
      doneMessage += `${ prefix } ${ cyan('cd') } ${ dir }\n`
    }
    switch (pkgManager) {
      case PkgManager.YARN:
        doneMessage += `${ prefix } yarn`
        doneMessage += `${ prefix } yarn start`
        break
      default:
        doneMessage += `${ prefix } ${ pkgManager } install`
        doneMessage += `${ prefix } ${ pkgManager } run start`
        break
    }
    
    outro(doneMessage)
    
    process.exit(0)
  }
  
  async handlePrompts(cmdArgs: string | undefined, options: Record<string, boolean>): Promise<PromptsResult> {
    if (options.all) {
      await handleDirConflict(defaultProjectName, options)
      
      return createDefaultConfig()
    }
    
    // 1. Get project name and target dir
    const prjName = cmdArgs ? toValidProjectName(cmdArgs) : undefined
    const projectName = prjName
      ? prjName
      : await text({
        message: MESSAGES.PROJECT_NAME_QUESTION,
        placeholder: 'Anonymous',
        defaultValue: 'nest-minimum-app',
      }) as string
    assertPrompt(projectName)
    const targetDir = toValidProjectName(projectName)
    
    // 2. Handle directory if exist and not empty
    await handleDirConflict(targetDir, options)
    
    // 3. Get package name
    const pkgName = basename(resolve(targetDir))
    const packageName = isValidPackageName(pkgName)
      ? pkgName
      : await text({
        message: MESSAGES.PACKAGE_NAME_QUESTION,
        initialValue: toValidPackageName(pkgName),
        placeholder: toValidPackageName(pkgName),
        validate(val) {
          if (!isValidPackageName(val)) {
            return 'Invalid'
          }
        },
      }) as string
    assertPrompt(packageName)
    
    // 4. Get project description
    const description = await text({
      message: MESSAGES.PACKAGE_DESCRIPTION_QUESTION,
      placeholder: 'Anonymous',
      defaultValue: 'Nest Minimum Application',
    }) as string
    assertPrompt(description)
    
    // 5. Choose a package manager
    const pkgManager = await select({
      message: MESSAGES.PACKAGE_MANAGER_QUESTION,
      options: (await Promise.all([
        PkgManager.PNPM,
        PkgManager.NPM,
        PkgManager.YARN,
      ].map(async k => {
        const version = await checkVersion(k)
        return { label: k, value: k, hint: version }
      }))).filter(k => k.hint),
    }) as PkgManager
    assertPrompt(pkgManager)
    
    // 6. Choose an HTTP library
    const httpLib = await select({
      message: MESSAGES.HTTP_LIBRARY_QUESTION,
      options: [
        HttpLibrary.EXPRESS,
        HttpLibrary.FASTIFY,
      ].map(k => ({ label: k, value: k })),
    }) as HttpLibrary
    assertPrompt(httpLib)
    
    // 7. Confirm whether you use Vitest
    const useVitest = await confirm({
      message: MESSAGES.VITEST_USE_QUESTION,
    }) as boolean
    assertPrompt(useVitest)
    
    // 8. Confirm whether you use SWC
    const useSwc = useVitest || await confirm({
      message: MESSAGES.SWC_USE_QUESTION,
    }) as boolean
    assertPrompt(useSwc)
    
    // 9. Confirm whether you use @nestjs/cli
    const useCli = useSwc || await confirm({
      message: MESSAGES.CLI_USE_QUESTION,
      inactive: `No (Installed globally)`,
    }) as boolean
    assertPrompt(useCli)
    
    // 10. Confirm whether you use Git
    const useGit = await isGitRepo() ? false : await confirm({
      message: MESSAGES.GIT_USE_QUESTION,
    }) as boolean
    assertPrompt(useGit)
    
    return {
      targetDir,
      packageName,
      description,
      pkgManager,
      httpLib,
      useVitest,
      useSwc,
      useCli,
      useGit,
    }
  }
}
