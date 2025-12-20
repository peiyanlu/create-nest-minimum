import { confirm, select, text } from '@clack/prompts'
import { emptyDir, PkgManager, YesOrNo } from '@peiyanlu/cli-tools'
import { existsSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import { resolve } from 'path'
import { afterEach, beforeEach, describe, expect, it, afterAll, vi } from 'vitest'
import { Action, HttpLibrary } from '../src/action.js'


vi.mock('@clack/prompts')

const mockedText = vi.mocked(text)
const mockedSelect = vi.mocked(select)
const mockedConfirm = vi.mocked(confirm)
const exitSpy = vi.spyOn(process, 'exit')
  .mockImplementation(() => {throw Error()})


const projectName = 'nest-minimum-app'
const description = 'Nest Minimum Application.'

const CWD = process.cwd()
const TMP_CWD = resolve(__dirname, '.tmp')
const TMP_DIR = resolve(TMP_CWD, projectName)

const makeDirty = () => mkdir(resolve(TMP_DIR, 'subfolder'), { recursive: true })


beforeEach(async () => {
  await mkdir(TMP_DIR, { recursive: true })
  process.chdir(TMP_CWD)
})

afterEach(async () => {
  if (existsSync(TMP_DIR)) {
    await rm(TMP_DIR, { recursive: true })
  }
})

afterAll(async () => {
  if (existsSync(TMP_CWD)) {
    process.chdir(CWD)
    await rm(TMP_CWD, { recursive: true })
  }
})


describe('create: default project', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(TMP_DIR, [])
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(YesOrNo.Yes)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce(HttpLibrary.FASTIFY)
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 9. Confirm whether you use @nestjs/cli
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // // 10. Confirm whether you use Git
    // mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      httpLib: HttpLibrary.FASTIFY,
      useVitest: false,
      useSwc: true,
      useCli: true,
      useGit: false,
    })
  })
})


describe('create: custom package name', () => {
  const projectName = 'nest minimum app'
  const packageName = projectName.replace(/\s+/g, '-')
  
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(resolve(TMP_CWD, projectName), [])
    
    // 1. Get project name and target dir (cmdArgs is undefined)
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(YesOrNo.Yes)
    
    // 3. Get package name
    mockedText.mockResolvedValueOnce(packageName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.NPM)
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce(HttpLibrary.EXPRESS)
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 8. Confirm whether you use SWC
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // // 9. Confirm whether you use @nestjs/cli
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // // 10. Confirm whether you use Git
    // mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: packageName,
      description: description,
      pkgManager: PkgManager.NPM,
      httpLib: HttpLibrary.EXPRESS,
      useVitest: true,
      useSwc: true,
      useCli: true,
      useGit: false,
    })
  })
})


describe('create: non-empty dir (confirm overwrite)', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(YesOrNo.Yes)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce(HttpLibrary.FASTIFY)
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 10. Confirm whether you use Git
    // mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      httpLib: HttpLibrary.FASTIFY,
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: false,
    })
  })
})


describe('create: with CLI args', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await makeDirty()
    
    // // 1. Get project name and target dir
    // mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce(YesOrNo.Yes)
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce(HttpLibrary.FASTIFY)
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 10. Confirm whether you use Git
    // mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(projectName, { overwrite: true })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      httpLib: HttpLibrary.FASTIFY,
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: false,
    })
  })
})


describe('create: exit on non-empty dir', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(YesOrNo.No)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = action.handlePrompts(undefined, { overwrite: false })
    await expect(res).rejects.toThrow('process.exit unexpectedly called with "0"')
    
    exitSpy.mockRestore()
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
  })
})


describe('create: current dir (.)', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await makeDirty()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce(YesOrNo.Ignore)
    
    // 3. Get package name
    mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce(description)
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce(PkgManager.PNPM)
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce(HttpLibrary.FASTIFY)
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 10. Confirm whether you use Git
    // mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handlePrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: '.',
      packageName: projectName,
      description: description,
      pkgManager: PkgManager.PNPM,
      httpLib: HttpLibrary.FASTIFY,
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: false,
    })
  })
})
