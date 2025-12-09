import { cancel, confirm, intro, isCancel, outro, select, tasks, text } from '@clack/prompts'
import { cyan, gray } from 'ansis'
import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { copyFile, readdir } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { MESSAGES } from './messages.js'
import {
  __dirname,
  editFile,
  emptyDir,
  execAsync,
  isEmpty,
  isGitRepo,
  isValidPackageName,
  toValidPackageName,
  toValidProjectName,
} from './utils.js'


export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
}

export enum HttpLibrary {
  EXPRESS = 'express',
  FASTIFY = 'fastify',
}

export enum YesOrNo {
  Yes = 'yes',
  No = 'no',
  Null = 'null',
}

export interface PromptsResult {
  targetDir: string;
  packageName: string;
  description: string;
  pkgManager: PackageManager;
  httpLib: HttpLibrary;
  useVitest: boolean;
  useSwc: boolean;
  useCli: boolean;
  useGit: boolean;
}

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore',
  [`${ HttpLibrary.EXPRESS }.ts`]: 'main.ts',
  [`${ HttpLibrary.FASTIFY }.ts`]: 'main.ts',
}

const vitestFiles: string[] = [
  'app.controller.spec.ts',
  'test',
  'app.e2e-spec.ts',
  'vitest.config.mts',
  'vitest.config.e2e.mts',
  'vitest-globals.d.ts',
]

const reverseFiles = {
  [HttpLibrary.FASTIFY]: HttpLibrary.EXPRESS,
  [HttpLibrary.EXPRESS]: HttpLibrary.FASTIFY,
}


const copyDirAsync = async (source: string, target: string, opts: PromptsResult) => {
  mkdirSync(target, { recursive: true })
  const entries = await readdir(source, { withFileTypes: true })
  for (const entry of entries) {
    const { httpLib, useVitest } = opts
    const name = entry.name
    const isDir = entry.isDirectory()
    
    if (!isDir && name === `${ reverseFiles[httpLib] }.ts`) {
      continue
    }
    
    if (!useVitest && vitestFiles.includes(name)) {
      continue
    }
    
    const srcPath = join(source, name)
    const destPath = join(target, !isDir ? (renameFiles[name] ?? name) : name)
    if (isDir) {
      await copyDirAsync(srcPath, destPath, opts)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

const assertPrompt = (value: unknown) => {
  if (isCancel(value)) {
    cancel('Operation cancelled')
    process.exit(0)
  }
}


export class Action {
  public async handle(cmdArgs: string | undefined, options: Record<string, boolean>): Promise<void> {
    intro(cyan('create-nest-minimum-app'))
    
    const config = await this.handlePrompts(cmdArgs, options)
    const { targetDir, packageName, description, pkgManager, httpLib, useSwc, useCli, useVitest, useGit } = config
    
    if (options.dryRun) {
      outro(MESSAGES.DRY_RUN_MODE)
      process.exit(0)
    }
    
    const cwd: string = process.cwd()
    const target = join(cwd, targetDir)
    
    await tasks([
      {
        title: MESSAGES.PROJECT_INFORMATION_START,
        task: async () => {
          const jr = (p: string) => join(target, p)
          
          const isYarn = pkgManager === PackageManager.YARN
          
          // -----------------------------------------------------
          const templateDir = resolve(__dirname, '..', 'template')
          await copyDirAsync(templateDir, target, config)
          
          if (useSwc || useVitest) {
            await editFile(jr('nest-cli.json'), (content: string) => {
              const json = JSON.parse(content)
              json.generateOptions.spec = useVitest
              if (useSwc) {
                json.compilerOptions = {
                  builder: 'swc',
                  typeCheck: true,
                  ...json.compilerOptions,
                }
              }
              return JSON.stringify(json, null, 2)
            })
          }
          
          await editFile(jr('README.md'), content => {
            return content
              .replace(/\$PACKAGE_NAME/g, packageName)
              .replace(/\$DESCRIPTION/g, description)
              .replace(/\$INSTALL/g, isYarn ? 'yarn' : `${ pkgManager } install`)
              .replace(/\$RUN/g, isYarn ? 'yarn' : `${ pkgManager } run`)
              .replace(/\$START([\s\S]*?)\$END/g, (_, $1) => useVitest ? $1 : '')
              .replace(/(\r?\n){3,}/g, '\r\n'.repeat(2))
          })
          
          // -----------------------------------------------------
          process.chdir(targetDir)
          
          // -----------------------------------------------------
          const scripts: Record<string, string> = {}
          const deps = [ `@nestjs/platform-${ reverseFiles[httpLib] }` ]
          
          const swcDeps = [ '@swc/cli', '@swc/core' ]
          const cli = [ '@nestjs/cli' ]
          const devDeps = (useSwc || useVitest)
            ? []
            : useCli
              ? swcDeps
              : [ ...swcDeps, ...cli ]
          
          // -----------------------------------------------------
          if (!useVitest) {
            const vitest = [
              'vitest',
              '@vitest/coverage-v8',
              'unplugin-swc',
              '@nestjs/testing',
              'supertest',
              '@types/supertest',
            ]
            devDeps.push(...vitest)
          }
          if (useVitest) {
            Object.assign(scripts, {
              test: 'vitest',
              'test:e2e': 'vitest run -c ./vitest.config.e2e.mts',
              'test:cov': 'vitest run --coverage',
            })
            
            // renovate: datasource=npm depName=vitest
            const rVersion = '3.0.8'
          }
          
          // -----------------------------------------------------
          const del = deps.map(k => `dependencies[${ k }]`)
            .concat(devDeps.map(k => `devDependencies[${ k }]`))
            .join(' ')
          const add = Object.entries(scripts)
            .map(([ k, v ]) => `scripts.${ k }="${ v }"`)
            .join(' ')
          const cmdArr = [
            `npm pkg set name="${ packageName }" description="${ description }"`,
          ]
          if (del) cmdArr.push(`npm pkg delete ${ del }`)
          if (add) cmdArr.push(`npm pkg set ${ add }`)
          if (useGit) {
            const git = [
              'git init',
              'git branch -M master',
            ]
            cmdArr.push(...git)
          }
          
          for (const cmd of cmdArr) {
            await execAsync(cmd)
          }
          
          return MESSAGES.PROJECT_INFORMATION_END
        },
      },
    ])
    
    let doneMessage = '🎉  Done. Now run:\n'
    const cdProjectName = relative(cwd, target)
    const prefix = `\n  ${ gray('$') }`
    if (target !== cwd) {
      const cd = cdProjectName.includes(' ') ? `"${ cdProjectName }"` : cdProjectName
      doneMessage += `${ prefix } ${ cyan('cd') } ${ cd }\n`
    }
    switch (pkgManager) {
      case PackageManager.YARN:
        doneMessage += `${ prefix } yarn`
        doneMessage += `${ prefix } yarn start`
        break
      default:
        doneMessage += `${ prefix } ${ pkgManager } install`
        doneMessage += `${ prefix } ${ pkgManager } run start`
        break
    }
    
    outro(doneMessage)
    
    await setTimeout(1000)
    process.exit(0)
  }
  
  async handlePrompts(cmdArgs: string | undefined, options: Record<string, boolean>): Promise<PromptsResult> {
    if (options.all) {
      return {
        targetDir: 'nest-minimum-app',
        packageName: 'nest-minimum-app',
        description: 'Nest Minimum Application.',
        pkgManager: PackageManager.NPM,
        httpLib: HttpLibrary.EXPRESS,
        useVitest: true,
        useSwc: true,
        useCli: true,
        useGit: true,
      }
    }
    
    // 1. Get project name and target dir
    let targetDir = cmdArgs ? toValidProjectName(cmdArgs) : undefined
    if (!targetDir) {
      const projectNameResult = await text({
        message: MESSAGES.PROJECT_NAME_QUESTION,
        placeholder: 'Anonymous',
        defaultValue: 'nest-minimum-app',
      }) as string
      assertPrompt(projectNameResult)
      targetDir = toValidProjectName(projectNameResult)
    }
    
    // 2. Handle directory if exist and not empty
    const isExists = existsSync(targetDir)
    const ignore = [ '.git', '.idea', '.vscode' ]
    if (isExists && !await isEmpty(targetDir, ignore)) {
      const overwrite = options.overwrite
        ? YesOrNo.Yes
        : await select({
          message: MESSAGES.DIRECTION_CONFLICT_QUESTION(targetDir),
          options: [
            {
              label: 'Cancel operation',
              value: YesOrNo.No,
            },
            {
              label: 'Remove files and continue',
              value: YesOrNo.Yes,
            },
            {
              label: 'Ignore files and continue',
              value: YesOrNo.Null,
            },
          ],
        })
      assertPrompt(overwrite)
      switch (overwrite) {
        case YesOrNo.Yes:
          await emptyDir(targetDir, ignore)
          break
        case YesOrNo.No:
          process.exit(0)
      }
    }
    
    // 3. Get package name
    let packageName = basename(resolve(targetDir))
    if (!isValidPackageName(packageName)) {
      const packageNameResult = await text({
        message: MESSAGES.PACKAGE_NAME_QUESTION,
        initialValue: toValidPackageName(packageName),
        placeholder: 'Anonymous',
        validate(val) {
          if (!isValidPackageName(val)) {
            return 'Invalid package.json name'
          }
        },
      }) as string
      assertPrompt(packageNameResult)
      packageName = packageNameResult
    }
    
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
      options: [
        PackageManager.NPM,
        PackageManager.YARN,
        PackageManager.PNPM,
      ].map(k => {
        try {
          const version = execSync(`${ k } --version`, { encoding: 'utf-8', stdio: 'pipe' })
          return {
            label: k,
            value: k,
            hint: version.trim(),
          }
        } catch (e) {
          return {
            label: k,
            value: k,
            hint: undefined,
          }
        }
      }).filter(k => k.hint),
    }) as PackageManager
    assertPrompt(pkgManager)
    
    // 6. Choose an HTTP library
    const httpLib = await select({
      message: MESSAGES.HTTP_LIBRARY_QUESTION,
      options: [
        {
          label: HttpLibrary.EXPRESS,
          value: HttpLibrary.EXPRESS,
        },
        {
          label: HttpLibrary.FASTIFY,
          value: HttpLibrary.FASTIFY,
        },
      ],
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
