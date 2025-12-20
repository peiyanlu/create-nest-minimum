import { execAsync } from '@peiyanlu/cli-tools'
import { scheduler } from 'node:timers/promises'


export class Context<TConfig> {
  private scriptsToSet: Record<string, string> = {}
  private pendingCommands: string[] = []
  private depsToRemove: string[] = []
  private devDepsToRemove: string[] = []
  
  constructor(public config: TConfig) {}
  
  setScripts(s: Record<string, string>) {
    Object.assign(this.scriptsToSet, s)
  }
  
  removeDeps(list: string[]) {
    this.depsToRemove.push(...list)
  }
  
  removeDevDeps(list: string[]) {
    this.devDepsToRemove.push(...list)
  }
  
  enqueueCommand(list: string[]) {
    this.pendingCommands.push(...list)
  }
  
  async applyChanges() {
    const del = this.depsToRemove.map(k => `dependencies[${ k }]`)
      .concat(this.devDepsToRemove.map(k => `devDependencies[${ k }]`))
      .join(' ')
    const add = Object.entries(this.scriptsToSet)
      .map(([ k, v ]) => `scripts.${ k }="${ v }"`)
      .join(' ')
    
    if (del) this.enqueueCommand([ `npm pkg delete ${ del }` ])
    if (add) this.enqueueCommand([ `npm pkg set ${ add }` ])
    
    for (const cmd of this.pendingCommands) {
      await execAsync(cmd)
      await scheduler.yield()
    }
  }
}

