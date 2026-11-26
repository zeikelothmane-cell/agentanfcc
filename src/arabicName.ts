// Common Moroccan spellings take precedence over the phonetic approximation.
const known: Record<string,string> = {
  mohamed:'محمد', mohammed:'محمد', muhammad:'محمد', ahmed:'أحمد', ahmad:'أحمد',
  othmane:'عثمان', othman:'عثمان', ousmane:'عثمان', youssef:'يوسف', youcef:'يوسف',
  amine:'أمين', amin:'أمين', amina:'أمينة', amineh:'أمينة', ali:'علي', omar:'عمر',
  said:'سعيد', saida:'سعيدة', souad:'سعاد', fatima:'فاطمة', zahra:'زهراء',
  zahrae:'زهراء', zohra:'زهرة', aicha:'عائشة', khadija:'خديجة', meriem:'مريم',
  maryam:'مريم', meryem:'مريم', karima:'كريمة', naima:'نعيمة', imane:'إيمان',
  ghizlane:'غزلان', ghislane:'غزلان', ilham:'إلهام', hassan:'حسن', hicham:'هشام',
  hamza:'حمزة', idriss:'إدريس', anas:'أنس', ilyas:'إلياس', yassine:'ياسين',
  mehdi:'مهدي', elmehdi:'المهدي', tariq:'طارق', tarik:'طارق', ayoub:'أيوب',
  reda:'رضا', rida:'رضا', rachid:'رشيد', rachida:'رشيدة', khalid:'خالد',
  khaled:'خالد', salma:'سلمى', salima:'سليمة', sanae:'سناء', houda:'هدى',
  nadia:'نادية', hanane:'حنان', fatiha:'فتيحة', sara:'سارة', sarah:'سارة',
  nour:'نور', noura:'نورة', habiba:'حبيبة', salim:'سليم', salih:'صالح',
  abdelaziz:'عبد العزيز', abdelilah:'عبد الإله', abdelhak:'عبد الحق',
  abdelkarim:'عبد الكريم', abderrahmane:'عبد الرحمن', abdellah:'عبد الله',
  abdallah:'عبد الله', abdelali:'عبد العالي', abdellatif:'عبد اللطيف',
  el:'ال', al:'ال', ben:'بن', ibn:'ابن', ait:'آيت', oulad:'أولاد', moulay:'مولاي',
  alaoui:'علوي', aloui:'علوي', amrani:'عمراني', mansouri:'منصوري',
  idrissi:'إدريسي', fassi:'فاسي', alami:'علمي', bennani:'بناني', tahiri:'طاهري',
}
const sounds: Record<string,string> = {
  kh:'خ', gh:'غ', ch:'ش', sh:'ش', ou:'و', oo:'و', ph:'ف', th:'ث', dh:'ذ',
  ei:'ي', ai:'ي', ay:'اي', qu:'ك', aa:'ا', ee:'ي',
  b:'ب', c:'ك', d:'د', f:'ف', g:'گ', h:'ه', j:'ج', k:'ك', l:'ل', m:'م',
  n:'ن', p:'ب', q:'ق', r:'ر', s:'س', t:'ت', v:'ف', w:'و', x:'كس', y:'ي',
  z:'ز', a:'ا', i:'ي', u:'و', o:'و', e:'', '3':'ع', '7':'ح', '9':'ق',
}
function spell(word:string):string {
  if (Object.hasOwn(known,word)) return known[word]
  if (word.length>4 && /^(el|al)/.test(word)) return 'ال'+spell(word.slice(2))
  let result=''
  for(let i=0;i<word.length;i++){
    const pair=word.slice(i,i+2)
    if (pair.length===2 && Object.hasOwn(sounds,pair)) { result+=sounds[pair]; i++; continue }
    const letter=word[i]
    if (i===0 && /[aeiou]/.test(letter)) result+=/[ei]/.test(letter)?'إ':'أ'
    else if (letter==='c' && /[eiy]/.test(word[i+1]||' ')) result+='س'
    else if (i===0 || letter!==word[i-1]) result+=sounds[letter]??letter
  }
  return result
}
export function suggestArabic(name:string):string {
  const normalized=name.trim().normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
  if (!normalized || !/^[a-z379 '’-]+$/.test(normalized)) return ''
  return normalized.split(/[\s'’-]+/).filter(Boolean).map(spell).join(' ').replace(/(^| )ال (?=\S)/g,'$1ال')
}
