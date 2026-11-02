import argparse
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def run(url,screenshots=None):
    checks=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in [380,1280]:
            page=await browser.new_page(viewport={'width':width,'height':900},reduced_motion='reduce')
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            async def check(name,value):checks.append({'width':width,'test':name,'passed':bool(value)})
            async def submit():
                await page.locator('#check-h2o').focus();await page.keyboard.press('Enter')
                await check('result focus after keyboard check',await page.evaluate("document.activeElement.id==='h2o-result'"))
            async def status(expected,name):await check(name,await page.locator('[data-h2o-status]').get_attribute('data-h2o-status')==expected)
            async def integrity(step):
                await check('unique IDs and resolved references',await page.evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id),refs=[...document.querySelectorAll('[aria-labelledby],[aria-describedby],label[for]')].flatMap(e=>[...(e.getAttribute('aria-labelledby')||'').split(' '),...(e.getAttribute('aria-describedby')||'').split(' '),e.getAttribute('for')].filter(Boolean));return ids.length===new Set(ids).size&&refs.every(id=>document.getElementById(id))})()"))
                await check('one connected persistent live region',await page.evaluate("document.querySelectorAll('[role=status]').length===1&&live===document.querySelector('#guided-announcements')&&live.isConnected"))
                await check('narrow/desktop no overflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                await page.evaluate("document.documentElement.style.fontSize='200%'")
                await check('root-text enlargement reflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                await page.evaluate("document.documentElement.style.fontSize=''")
                if screenshots:
                    Path(screenshots).mkdir(parents=True,exist_ok=True)
                    await page.screenshot(path=str(Path(screenshots)/f'h2o-step{step}-{width}.png'),full_page=True)
            await page.goto(url,wait_until='networkidle')
            await page.evaluate("window.live=document.querySelector('#guided-announcements')")
            for _ in range(5):await page.locator('#next').click()
            await check('Step 6 heading receives focus',await page.evaluate("document.activeElement.id==='step-title'"))
            await submit();await status('blocked','unanswered retained construction blocks matching')
            await page.locator('#to-set').click();await page.locator('#edit-sum').click();await page.locator('#same').click();await page.locator('#next').click()
            await page.locator('#opposite').click();await page.locator('#flip').click();await page.locator('#next').click();await page.locator('#next').click()
            await page.locator('#match-0').select_option('pz');await page.locator('#match-1').select_option('px');await submit();await status('incorrect','course partner alone is not all symmetry matches')
            await page.locator('#match-0').select_option('s,pz');await submit();await status('correct','retained global-reverse difference accepted')
            await page.evaluate("window.mutations=0;new MutationObserver(r=>window.mutations+=r.length).observe(live,{childList:true,characterData:true,subtree:true})")
            await page.locator('#axes').uncheck();await page.wait_for_timeout(30)
            await check('axis toggle does not repeat result speech',await page.evaluate('mutations===0'))
            await integrity(6);await page.locator('#next').click()
            await page.locator('#partner-0').select_option('pz');await page.locator('#partner-1').select_option('px');await page.locator('#neglect').select_option('symmetry');await submit()
            await check('energy distinction explained','energy mismatch' in await page.locator('[data-h2o-status]').inner_text())
            await check('incorrect route does not manufacture products',await page.locator('[data-h2o=product]').count()==0)
            await page.locator('#neglect').select_option('energy')
            await check('six interaction-to-product tasks',await page.locator('.construction-flow').count()==6)
            for i in range(6):await page.locator('#product-'+str(i)).select_option('bonding' if i in [0,2] else 'antibonding' if i in [1,3] else 'nonbonding')
            await page.locator('#product-0').select_option('antibonding');await page.locator('#product-1').select_option('bonding');await submit();await status('incorrect','correct aggregate count cannot hide wrong products')
            await page.locator('#product-0').select_option('bonding');await page.locator('#product-1').select_option('antibonding');await submit();await status('correct','all individual products accepted')
            await integrity(7);await page.locator('#next').click()
            for i in range(5):await page.locator('#level-'+str(i)).select_option('5' if i in [1,3] else '0')
            await submit();await status('unanswered','last blank level remains unanswered')
            await page.locator('#level-5').select_option('0');await page.locator('#level-1').select_option('0');await submit();await status('incorrect','violated required relation rejected')
            await page.locator('#level-1').select_option('5');await submit();await status('correct','alternative schematic placement satisfies partial order')
            await integrity(8);await page.locator('#next').click();await submit();await status('blocked','reference switch requires explicit acknowledgement')
            await page.locator('#reference').select_option('true')
            for i in [0,2,4,5]:await page.locator('#occupancy-'+str(i)).select_option('2')
            await page.locator('#occupancy-1').select_option('0');await submit();await status('unanswered','blank empty MO is not silently zero')
            await check('blank preserved',await page.locator('#occupancy-3').input_value()=='')
            await page.locator('#occupancy-3').select_option('0');await page.locator('#occupancy-4').select_option('1');await submit();await status('incorrect','wrong electron count rejected')
            await page.locator('#occupancy-4').select_option('2');await page.locator('#bond-order').select_option('2');await submit();await status('incorrect','total bond order is not per-bond answer')
            await page.locator('#bond-order').select_option('1');await submit();await status('correct','reference filling and interpretation accepted')
            await check('complete marker derived',await page.locator('[data-h2o-complete=true]').count()==1)
            await integrity(9)
            await page.locator('#back').click();await page.locator('#level-4').select_option('1');await page.locator('#next').click()
            await check('upstream edit clears dependent fill and acknowledgement',await page.locator('#occupancy-0').input_value()=='' and await page.locator('#reference').input_value()=='')
            await check('old success removed',await page.locator('[data-h2o-complete]').count()==0)
            await page.locator('#to-set').click();await page.locator('#edit-sum').click();await page.locator('#reset').click()
            for _ in range(3):await page.locator('#next').click()
            await check('ligand edit clears matching',await page.locator('#match-0').input_value()=='')
            await submit();await status('blocked','reset construction blocks downstream acceptance')
            await page.reload(wait_until='networkidle')
            await check('reload returns to initial state','01' in await page.locator('.step-count').inner_text())
            await check('no JavaScript errors',not errors)
            await page.close()
        version=browser.version;await browser.close()
    return {'browser':'Chromium '+version,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('url');parser.add_argument('--screenshots');args=parser.parse_args()
    report=asyncio.run(run(args.url,args.screenshots));print(json.dumps(report,indent=2));raise SystemExit(int(report['failed']>0))
