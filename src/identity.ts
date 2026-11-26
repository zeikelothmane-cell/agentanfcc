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
  // The back can carry a TD1 machine-readable zone even when printed labels are missing.
  const mrzLines = lines.map(line=>line.replace(/[ \t]/g,'').toUpperCase())
  const header = mrzLines.findIndex(line=>/^I[A-Z<]MAR[A-Z0-9<]{25}$/.test(line))
  const namesLine = header>=0 && /^[0-9]{6}[0-9][MFX<][0-9]{7}MAR/.test(mrzLines[header+1]||'')
    ? mrzLines[header+2]?.match(/^([A-Z]+(?:<[A-Z]+)*)<<([A-Z]+(?:<[A-Z]+)*)<*$/) : null
  let mrzCin=''
  if(header>=0){
    const doc=mrzLines[header].slice(5,14)
    const sum=[...doc].reduce((n,c,i)=>n+(c==='<'?0:parseInt(c,36))*[7,3,1][i%3],0)
    const number=doc.replace(/<+$/,'')
    if(sum%10===Number(mrzLines[header][14]) && /^[A-Z]{1,2}\d{4,8}$/.test(number)) mrzCin=number
  }
  return {
    last: value(/^nom\b/i, latin) || namesLine?.[1].replace(/</g,' ') || '',
    first: value(/^pr[ée]noms?\b/i, latin) || namesLine?.[2].replace(/</g,' ') || '',
    lastAr: value(/(?:ال[اإأ]سم العائلي|النسب)/, arabic), firstAr: value(/ال[اإأ]سم الشخصي/, arabic),
    address: value(/^(?:adresse\b|العنوان)/i, /^.+/), cin: mrzCin || (identifiers.length === 1 ? identifiers[0] : '')
  }
}
