import { expect,it } from 'vitest'
import { suggestArabic } from './arabicName'
it('propose une orthographe marocaine pour des noms composés et accentués',()=>{
  expect(suggestArabic('SAÏD')).toBe('سعيد')
  expect(suggestArabic('El-Mansouri')).toBe('المنصوري')
  expect(suggestArabic('Fatima Zahra')).toBe('فاطمة زهراء')
})
it('transcrit un nom absent du lexique sans envoyer de données',()=>{
  expect(suggestArabic('Zakhmi')).toBe('زاخمي')
  expect(suggestArabic('')).toBe('')
})
