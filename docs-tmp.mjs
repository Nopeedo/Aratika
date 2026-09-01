import puppeteer from 'puppeteer-core'
const SITES = [
  ['national','https://www.national.org.nz/plan'],
  ['labour','https://www.labour.org.nz/our-policies/'],
  ['green','https://www.greens.org.nz/policy'],
  ['act','https://www.act.org.nz/policies'],
  ['nzfirst','https://www.nzfirst.nz/policy'],
  ['tpm','https://www.maoriparty.org.nz/policy'],
  ['top','https://www.opportunity.org.nz/policy'],
  ['alliance','https://allianceparty.nz/what-we-stand-for/'],
  ['alcp','https://alcp.org.nz/policy/'],
  ['womens-rights','https://womensrightsparty.nz/policy/'],
  ['conservative','https://www.conservatives.org.nz/policies/overview'],
  ['animal-justice','https://animaljustice.org.nz/policy/'],
  ['vision-nz','https://www.vision.org.nz/visionpolicies'],
  ['free-palestine','https://palfree.nz/'],
]
const b = await puppeteer.launch({ headless:'new', executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--no-sandbox'] })
const p = await b.newPage()
await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36')
for (const [slug,url] of SITES) {
  try {
    await p.goto(url,{waitUntil:'networkidle2',timeout:60000}); await new Promise(x=>setTimeout(x,2200))
    const docs = await p.evaluate(() => {
      const seen = new Set()
      return [...document.querySelectorAll('a')]
        .map(a=>({href:a.href, text:(a.innerText||'').replace(/\s+/g,' ').trim().slice(0,54)}))
        .filter(l=>/\.pdf($|\?)|\.docx?($|\?)|manifesto|policy-document|full-policy|our-plan/i.test(l.href))
        .filter(l=>!seen.has(l.href)&&seen.add(l.href))
    })
    console.log(`\n${slug}  (${docs.length})`)
    docs.slice(0,8).forEach(d=>console.log(`    ${(d.text||'(no text)').padEnd(40).slice(0,40)}  ${d.href.replace(/^https?:\/\/(www\.)?/,'').slice(0,90)}`))
    if (!docs.length) console.log('    — none found on this page')
  } catch(e){ console.log(`\n${slug}  ERR ${e.message.slice(0,40)}`) }
}
await b.close()
