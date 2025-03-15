All mandatory dependencies

As a hard/production dependencies, we need:

```text
pnpm add reflect-metadata @nestjs/common @nestjs/core
##       |
##       +--> For TS decorators introspection

## Since we'll use express as the underlying HTTP lib:
pnpm add @nestjs/platform-express
```

As a development dependencies, we got:

```text
pnpm add --save-dev typescript @types/node @nestjs/cli
```

Improve

SWC

```text
pnpm add --save-dev @swc/cli @swc/core
```

Vitest

```text
pnpm add --save-dev vitest @vitest/coverage-v8 unplugin-swc @nestjs/testing supertest @types/supertest
```
