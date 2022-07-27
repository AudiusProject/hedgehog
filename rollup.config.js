import typescript from 'rollup-plugin-typescript2'
import copy from 'rollup-plugin-copy'

import pkg from './package.json'

export default [
  {
    input: 'src/index.ts',
    output: {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true
    },
    external: [
      'bip39',
      'browserify-cipher/browser',
      'ethereumjs-wallet',
      'node-localstorage',
      'randombytes',
      'safe-buffer',
      './src/authWorker.js'
    ],
    plugins: [
      typescript({
        tsconfigOverride: { compilerOptions: { module: 'esnext' } }
      }),
      copy({ targets: [{ src: './src/authWorker.js', dest: 'dist' }] })
    ]
  }
]
