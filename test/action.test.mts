import { confirm, select, text } from '@clack/prompts'
import { mkdirSync } from 'node:fs'
import { join, resolve } from 'path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Action } from '../src/action'
import { emptyDir } from '../src/utils'


vi.mock('@clack/prompts')

const mockedText = vi.mocked(text)
const mockedSelect = vi.mocked(select)
const mockedConfirm = vi.mocked(confirm)
const exitSpy = vi.spyOn(process, 'exit')
  .mockImplementation(() => {throw Error()})


const projectName = 'nest-minimum-app'


describe('The project name cannot be used as the package name', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(resolve(process.cwd(), 'nest minimum app'), [])
    
    // 1. Get project name and target dir (cmdArgs is undefined)
    mockedText.mockResolvedValueOnce('nest minimum app')
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // 3. Get package name
    mockedText.mockResolvedValueOnce('my-package')
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A nest minimum app')
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce('npm')
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce('express')
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 8. Confirm whether you use SWC
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // // 9. Confirm whether you use @nestjs/cli
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // 10. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handelPrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: 'nest minimum app',
      packageName: 'my-package',
      description: 'A nest minimum app',
      pkgManager: 'npm',
      httpLib: 'express',
      useVitest: true,
      useSwc: true,
      useCli: true,
      useGit: true,
    })
  })
})


describe('The project name can be used as the package name', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    
    await emptyDir(resolve(process.cwd(), projectName), [])
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A nest minimum app')
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce('fastify')
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(true)
    
    // // 9. Confirm whether you use @nestjs/cli
    // mockedConfirm.mockResolvedValueOnce(true)
    
    // 10. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handelPrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A nest minimum app',
      pkgManager: 'pnpm',
      httpLib: 'fastify',
      useVitest: false,
      useSwc: true,
      useCli: true,
      useGit: false,
    })
  })
})


describe('The project directory is not empty', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce(projectName)
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A nest minimum app')
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce('fastify')
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 10. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handelPrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A nest minimum app',
      pkgManager: 'pnpm',
      httpLib: 'fastify',
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: false,
    })
  })
})


describe('The command-line argument overwrite is true', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // // 1. Get project name and target dir
    // mockedText.mockResolvedValueOnce(projectName)
    
    // // 2. Handle directory if exist and not empty
    // mockedSelect.mockResolvedValueOnce('yes')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A nest minimum app')
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce('fastify')
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 10. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(true)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handelPrompts(projectName, { overwrite: true })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: projectName,
      packageName: projectName,
      description: 'A nest minimum app',
      pkgManager: 'pnpm',
      httpLib: 'fastify',
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: true,
    })
  })
})


describe('Exit when the target directory is not empty', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    mkdirSync(join(process.cwd(), projectName, 'subfolder'), { recursive: true })
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('no')
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = action.handelPrompts(undefined, { overwrite: false })
    await expect(res).rejects.toThrow('process.exit unexpectedly called with "0"')
    
    exitSpy.mockRestore()
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
  })
})


describe('The target directory is the current directory', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    
    // 1. Get project name and target dir
    mockedText.mockResolvedValueOnce('.')
    
    // 2. Handle directory if exist and not empty
    mockedSelect.mockResolvedValueOnce('ignore')
    
    // // 3. Get package name
    // mockedText.mockResolvedValueOnce(projectName)
    
    // 4. Get project description
    mockedText.mockResolvedValueOnce('A nest minimum app')
    
    // 5. Choose a package manager
    mockedSelect.mockResolvedValueOnce('pnpm')
    
    // 6. Choose an HTTP library
    mockedSelect.mockResolvedValueOnce('fastify')
    
    // 7. Confirm whether you use Vitest
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 8. Confirm whether you use SWC
    mockedConfirm.mockResolvedValueOnce(false)
    
    // 9. Confirm whether you use @nestjs/cli
    mockedConfirm.mockResolvedValueOnce(true)
    
    // 10. Confirm whether you use Git
    mockedConfirm.mockResolvedValueOnce(false)
  })
  
  it('should run create action correctly', async () => {
    const action = new Action()
    // provide cmdArgs and options, emulate command-line arguments
    const res = await action.handelPrompts(undefined, { overwrite: false })
    
    expect(text).toHaveBeenCalled()
    expect(select).toHaveBeenCalled()
    expect(confirm).toHaveBeenCalled()
    
    expect(res).toEqual({
      targetDir: '.',
      packageName: 'create-nest-minimum',
      description: 'A nest minimum app',
      pkgManager: 'pnpm',
      httpLib: 'fastify',
      useVitest: false,
      useSwc: false,
      useCli: true,
      useGit: false,
    })
  })
})
