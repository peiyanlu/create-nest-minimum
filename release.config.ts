import { defineConfig } from '@peiyanlu/release'


export default defineConfig({
  toTag(_pkg: string, version: string): string {
    return `${ version }`
  },
  git: {
    commitMessage: 'chore(release): v${tag}',
    tagMessage: 'v${tag}',
  },
  github: {
    releaseName: 'v${tag}',
  },
})
