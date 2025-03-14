import { green } from 'ansis'


export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'Project name:',
  PACKAGE_MANAGER_QUESTION: `Select package manager:`,
  PACKAGE_DESCRIPTION_QUESTION: 'Project description:',
  GIT_USE_QUESTION: `Create git repository?`,
  CLI_USE_QUESTION: `Use ${ green('@nestjs/cli') } as devDependencies?`,
  SWC_USE_QUESTION: `Use ${ green('SWC') }（Speedy Web Compiler）?`,
  HTTP_LIBRARY_QUESTION: `Select HTTP library:`,
  DIRECTION_CONFLICT_QUESTION: (targetDir: string) => {
    return `${ targetDir === '.' ? 'Current' : 'Target' } directory "${ green(targetDir) }" is not empty:`
  },
  PROJECT_INFORMATION_START: `Creating project in a few seconds`,
  PROJECT_INFORMATION_END: `Created project successfully!`,
  DRY_RUN_MODE: 'Command has been executed in dry run mode, nothing changed!',
}
