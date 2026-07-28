import * as esbuild from 'esbuild'
import { copyFileSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const cssSource = './resources/css/resized-column.css'
const cssOutput = './resources/dist/css/resized-column.css'

mkdirSync(dirname(cssOutput), { recursive: true })
copyFileSync(cssSource, cssOutput)

await esbuild.build({
    entryPoints: ['./resources/js/resized-column.js'],
    outfile: './resources/dist/js/resized-column.js',
    bundle: true,
    mainFields: ['module', 'main'],
    platform: 'neutral',
    treeShaking: true,
    target: ['es2020'],
    allowOverwrite: true,
    minify: true,
})


