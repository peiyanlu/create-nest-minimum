import { green, rgb, yellow } from 'ansis'


export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'Project name:',
  PACKAGE_MANAGER_QUESTION: `Select package manager:`,
  PACKAGE_DESCRIPTION_QUESTION: 'Project description:',
  GIT_USE_QUESTION: `Create ${ rgb(225, 92, 54)`Git` } repository?`,
  VITEST_USE_QUESTION: `Use ${ rgb(179, 209, 117)('Vitest') } as testing framework?`,
  SWC_USE_QUESTION: `Use ${ yellow('SWC') } (Speedy Web Compiler) to speed up development?`,
  CLI_USE_QUESTION: `Use ${ rgb(214, 64, 103)('@nestjs/cli') } as devDependencies?`,
  HTTP_LIBRARY_QUESTION: `Select HTTP library:`,
  DIRECTION_CONFLICT_QUESTION: (targetDir: string) => {
    return `${ targetDir === '.' ? 'Current' : 'Target' } directory "${ green(targetDir) }" is not empty:`
  },
  PROJECT_INFORMATION_START: `Creating project in a few seconds`,
  PROJECT_INFORMATION_END: `Created project successfully!`,
  DRY_RUN_MODE: 'Command has been executed in dry run mode, nothing changed!',
}
