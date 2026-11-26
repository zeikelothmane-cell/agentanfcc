import { expect, it } from 'vitest'
import { readIdentity } from './identity'

it('lit les libellés bilingues sur une ou deux lignes', () => {
  expect(readIdentity('Nom : EXEMPLE\nPrénom\nTEST\nالإسم العائلي: مثال\nالاسم الشخصي\nتجربة\nAdresse: Fès\nAB 123456')).toEqual({
    first:'TEST',last:'EXEMPLE',firstAr:'تجربة',lastAr:'مثال',address:'Fès',cin:'AB123456'
  })
})
it('laisse une CIN ambiguë vide', () => {
  expect(readIdentity('AA123456 BB234567').cin).toBe('')
})
it('récupère les noms français sur une zone lisible au verso sans libellés',()=>{
  const text=['IDMARAB123456<4'.padEnd(30,'<'),'8001014M3001019MAR'.padEnd(30,'<'),'EL<MANSOURI<<AMINE'.padEnd(30,'<')].join('\n')
  expect(readIdentity(text)).toMatchObject({last:'EL MANSOURI',first:'AMINE'})
})
