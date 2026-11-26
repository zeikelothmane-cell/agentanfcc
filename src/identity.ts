export function readIdentity(text: string) {
  const lines = text.normalize('NFKC').replace(/[\u200e\u200f\u0640]/g, '').split(/\r?\n/).map(line => line.trim())
  function value(label: RegExp, alphabet: RegExp) {
    for (let i = 0; i < lines.length; i++) {
      const match = label.exec(lines[i])
      if (!match) continue
      const rest = lines[i].slice(match.index + match[0].length).replace(/^\s*[:：-]?\s*/, '')
      const candidate = (rest || lines[i + 1] || '').match(alphabet)?.[0]?.trim()
      if (candidate) return candidate
    }
    return ''
  }
  const latin = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ '’-]*/
  const arabic = /^[\u0621-\u064a][\u0621-\u065f '’-]*/
  const identifiers = [...new Set((text.match(/\b[A-Z]{1,2}[ \t]*\d{4,8}\b/g) || []).map(s=>s.replace(/\s/g,'')))]
  return {
    last: value(/^nom\b/i, latin), first: value(/^pr[ée]noms?\b/i, latin),
    lastAr: value(/(?:ال[اإأ]سم العائلي|النسب)/, arabic), firstAr: value(/ال[اإأ]سم الشخصي/, arabic),
    address: value(/^(?:adresse\b|العنوان)/i, /^.+/), cin: identifiers.length === 1 ? identifiers[0] : ''
  }
}
