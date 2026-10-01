/*
  Resolves the project's `@/` path alias when the compiled tests run.

  tsc type-checks `@/lib/...` against tsconfig `paths`, but it does not rewrite
  the specifier in its output — that is a documented limitation, not a
  misconfiguration. Next.js does the rewriting in its own build, so the alias
  works everywhere except here.

  Rather than add a bundler or rewrite every import in lib/ to be relative, this
  teaches node's CommonJS resolver the same mapping for the duration of a test
  run: `@/lib/x` becomes `.test-build/lib/x`. It is loaded with --require, is
  never bundled, and has no effect on the application.
*/
const Module = require('node:module')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const BUILD = path.join(ROOT, '.test-build')

const original = Module._resolveFilename

Module._resolveFilename = function (request, ...rest) {
  if (typeof request === 'string' && request.startsWith('@/')) {
    return original.call(this, path.join(BUILD, request.slice(2)), ...rest)
  }
  return original.call(this, request, ...rest)
}
