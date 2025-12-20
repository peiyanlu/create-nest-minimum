import { green, rgb, yellow } from 'ansis'


export const MESSAGES = {
  PROJECT_NAME_QUESTION: 'Project name:',
  PACKAGE_NAME_QUESTION: 'Package name (npm):',
  PACKAGE_MANAGER_QUESTION: 'Select a package manager:',
  PACKAGE_DESCRIPTION_QUESTION: 'Package description:',
  
  GIT_USE_QUESTION: `Initialize ${ rgb(225, 92, 54)`Git` } repository?`,
  
  VITEST_USE_QUESTION: `Use ${ rgb(179, 209, 117)('Vitest') } for unit testing?`,
  SWC_USE_QUESTION: `Enable ${ yellow('SWC') } (Speedy Web Compiler) for faster builds?`,
  CLI_USE_QUESTION: `Add ${ rgb(214, 64, 103)('@nestjs/cli') } to devDependencies?`,
  
  HTTP_LIBRARY_QUESTION: 'Select an HTTP client library:',
  
  DIRECTORY_CONFLICT_QUESTION: (targetDir: string) =>
    `${ targetDir === '.' ? 'Current' : 'Target' } directory "${ green(targetDir) }" is not empty:`,
  
  PROJECT_INFORMATION_START: 'Creating project...',
  PROJECT_INFORMATION_END: 'Project created successfully!',
  
  OPERATION_ABORTED: 'Operation cancelled.',
  DRY_RUN_MODE: 'Dry run mode enabled. No files were created or modified.',
}
