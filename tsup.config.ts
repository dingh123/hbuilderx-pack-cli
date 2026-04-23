import { defineConfig } from 'tsup'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig([
  {
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    clean: true,
    banner: { js: '#!/usr/bin/env node' },
    sourcemap: false,
    define: { __VERSION__: JSON.stringify(version) },
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    sourcemap: false,
  },
])
