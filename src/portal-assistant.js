// This self-contained script runs from the operator's favourite on the official page.
(async () => {
  const origin = 'https://ancfcc-agent-pro.onrender.com'
  if (location.origin !== 'https://www.ancfcc.gov.ma' || location.pathname.replace(/\/$/, '') !== '/certificatspage') {
    alert('Ouvrez le formulaire officiel depuis le dossier ANCFCC.')
    return
  }
  const wait = async (read, message) => {
    for (let attempt = 0; attempt < 80; attempt++) {
      const value = read()
      if (value) return value
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(message)
  }
  const input = (field, value) => {
    if (!field) throw new Error('Champ officiel introuvable. Vérifiez le formulaire.')
    field.value = value
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }
  const choose = async (select, label) => {
    const option = await wait(() => Array.from(select?.options || []).find(o => o.text.trim().toUpperCase() === label.trim().toUpperCase()), 'Option indisponible sur le portail : ' + label)
    input(select, option.value)
  }
  const byId = id => document.getElementById(id)
  try {
    if (!window.opener) throw new Error('Revenez au dossier et utilisez « Ouvrir et préremplir ». Gardez les deux onglets ouverts.')
    const data = await new Promise((resolve, reject) => {
      const channel = new MessageChannel()
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error('Dossier expiré. Rouvrez le portail depuis le dossier.')) }, 8000)
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data) }
      window.opener.postMessage('ancfcc:request-draft', origin, [channel.port2])
    })
    window.opener = null
    const person = document.querySelector('input[name="typeDemandeur"][value="persPhysique"]') || document.querySelector('input[id="typeDemandeur"][value="persPhysique"]')
    if (!person) throw new Error('Choix Particulier introuvable.')
    if (!person.checked) person.click()
    await wait(() => byId('TextBoxNom')?.getBoundingClientRect().width, 'Formulaire particulier indisponible.')
    await choose(byId('DropDownTypeIdentite'), 'CIN')
    for (const [id, value] of Object.entries(data.fields)) input(byId(id), value)
    for (const [i, title] of data.titles.entries()) {
      const field = (suffix, id) => document.getElementsByName('ListTitreFoncier[' + i + '].' + suffix)[0] || (i === 0 && byId(id))
      if (i > 0) {
        const add = Array.from(document.links).find(a => a.textContent.includes('ajouter un titre foncier') && a.getBoundingClientRect().width)
        if (!add) throw new Error('Vérifiez les titres et ajoutez les titres restants sur le portail.')
        add.click()
      }
      const office = await wait(() => field('SelectedConservationFonciereId', 'DropDownConservation'), 'Vérifiez les titres restants sur le portail.')
      await choose(office, title.office)
      input(field('Reference', 'TextBoxReference'), title.number)
      await choose(field('SelectedIndiceId', 'DLLIndice'), title.index)
      if (title.special) await choose(field('SelectedIndiceSpecialId', 'DLLIndiceSpecial'), title.special)
    }
    const captcha = byId('TextBoxCapchaCode'), terms = byId('chkTerms'), next = byId('SWitchToNext')
    if (!captcha || !terms || !next) throw new Error('Vérifiez la fin du formulaire officiel.')
    const advance = () => {
      if (!captcha.value.trim() || !terms.checked || next.disabled) return
      terms.removeEventListener('change', advance)
      captcha.removeEventListener('keydown', enter)
      next.click()
    }
    const enter = event => { if (event.key === 'Enter') { event.preventDefault(); advance() } }
    terms.addEventListener('change', advance)
    captcha.addEventListener('keydown', enter)
    captcha.focus()
    captcha.scrollIntoView({block:'center'})
    const hint = document.createElement('p')
    hint.setAttribute('role', 'status')
    hint.textContent = 'Saisissez le CAPTCHA puis acceptez les mentions légales pour continuer. Si elles sont déjà cochées, appuyez sur Entrée.'
    captcha.parentElement.append(hint)
  } catch (error) { alert(error.message) }
})()
