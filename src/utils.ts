import { exec, execSync } from 'child_process'
import { existsSync } from 'fs'
import { readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'path'


export const promisify = <T extends (...args: any[]) => any>(fn: T) => (...args: Parameters<T>): Promise<ReturnType<T>> => {
  return new Promise<ReturnType<T>>((resolve, reject) => {
    try {
      const result = fn(...args)
      if (result instanceof Promise) {
        result.then(resolve).catch(reject)
      } else {
        resolve(result)
      }
    } catch (e) {
      reject(e)
    }
  })
}


export const execAsync = promisify(execSync)

// execSync(`npm view ${ packageName } version`, { encoding: 'utf8' }).trim()


export const isValidPackageName = (packageName: string) => {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(packageName)
}

export const toValidPackageName = (packageName: string) => packageName
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/^[._]/, '')
  .replace(/[^a-z\d\-~]+/g, '-')
  .slice(0, 214)

export const toValidProjectName = (projectName: string) => projectName
  .trim()
  // .replace(/[\x00-\x1F<>:"/\\|?*]+/g, '-')
  // .replace(/[-_]+/g, '-')
  // .replace(/^[.-]+/, '')
  .replace(/\/+/g, '')
  .slice(0, 255)

export const emptyDir = async (dir: string, ignore: string[]) => {
  if (!existsSync(dir)) {
    return false
  }
  for (const file of await readdir(dir)) {
    if (ignore.includes(file)) {
      continue
    }
    await rm(resolve(dir, file), { recursive: true, force: true })
  }
  return true
}

export const isEmpty = async (path: string, ignore: string[]) => {
  const files = await readdir(path)
  const a = files.sort()
  const b = ignore.sort()
  return a.length <= b.length && a.every((e, i) => e === b[i])
}

export const editFile = async (file: string, callback: (content: string) => string) => {
  const content = await readFile(file, 'utf-8')
  return writeFile(file, callback(content), 'utf-8')
}

export const isGitRepo = () => new Promise<boolean>((resolve) => {
  exec(`git rev-parse --is-inside-work-tree`, (error, stdout) => {
    resolve(error ? false : JSON.parse(stdout))
  })
})
