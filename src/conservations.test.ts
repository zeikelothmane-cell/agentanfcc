import { expect, it } from 'vitest'
import { normalizeTitle, officeIndices } from './conservations'

it.each(['zouagha',' Fès-Zouagha ','FES ZOUAGHA'])('restaure le choix officiel depuis %s',office=>{
  const title=normalizeTitle({office,index:' kf ',number:'123'})
  expect(title).toEqual({office:'FES ZOUAGHA',index:'KF',number:'123'})
  expect(officeIndices[title.office]).toContain(title.index)
})
it('distingue Fès et les noms de ville ambigus',()=>{
  expect(normalizeTitle({office:'Fès',index:'07'})).toEqual({office:'FES',index:'07'})
  expect(normalizeTitle({office:'Casa',index:'01'}).office).toBe('Casa')
})
