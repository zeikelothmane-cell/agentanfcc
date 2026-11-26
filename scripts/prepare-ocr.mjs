import { mkdir, copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const target=resolve('public/ocr')
await mkdir(target,{recursive:true})
const assets=[
  ['tesseract.js/dist/worker.min.js','worker.min.js'],
  ['tesseract.js/dist/worker.min.js.LICENSE.txt','worker.LICENSE.txt'],
  ['tesseract.js-core/LICENSE','core.LICENSE'],
  ...['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js'].map(name=>['tesseract.js-core/'+name,name]),
  ...['fra','ara'].map(lang=>['@tesseract.js-data/'+lang+'/4.0.0_best_int/'+lang+'.traineddata.gz',lang+'.traineddata.gz'])
]
await Promise.all(assets.map(([from,to])=>copyFile(resolve('node_modules',from),resolve(target,to))))
