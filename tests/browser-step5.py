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
            page=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce")
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            async def check(name,value):checks.append({"width":width,"test":name,"passed":bool(value)})
            async def reveal():
                for selector in ['#check-set','#check-independence','#check-symmetry']:await page.locator(selector).click()
            await page.goto(url,wait_until='networkidle')
            await page.evaluate("window.live=document.querySelector('#guided-announcements')")
            for _ in range(4):await page.locator('#next').click()
            await check('Step 5 heading focused',await page.evaluate("document.activeElement.id==='step-title'"))
            await check('two retained previews',await page.locator('.set-construction').count()==2)
            await check('unanswered not silently completed','(+, ?)' in await page.locator('.set-construction').nth(0).inner_text())
            await check('reference retained honestly','(+, +)' in await page.locator('.set-construction').nth(1).inner_text())
            await check('no unsupported Step 6',await page.locator('#next').count()==0)
            await page.locator('#check-set').focus();await page.keyboard.press('Enter')
            await check('count leads focus to independence',await page.evaluate("document.activeElement.id==='check-independence'"))
            await page.locator('#check-independence').click()
            await check('independence leads focus to symmetry',await page.evaluate("document.activeElement.id==='check-symmetry'"))
            await page.locator('#check-symmetry').click()
            await check('incomplete verdict',await page.locator('[data-set-status]').get_attribute('data-set-status')=='incomplete')
            await check('verdict receives focus',await page.evaluate("document.activeElement.id==='set-result'"))
            await page.locator('#edit-sum').click();await page.locator('#same').click()
            await page.locator('#next').click();await page.locator('#next').click()
            await reveal()
            await check('repeated sum rejected',await page.locator('[data-set-status]').get_attribute('data-set-status')=='invalid')
            await check('rank-one explanation','rank 1 of 2' in await page.locator('#lesson').inner_text())
            await page.locator('#edit-difference').click();await page.locator('#opposite').click();await page.locator('#flip').click();await page.locator('#next').click()
            await check('editing invalidates previous check',await page.locator('[data-set-status]').count()==0)
            await check('sum preview remains sum','(+, +)' in await page.locator('.set-construction').nth(0).inner_text())
            await check('difference preview is not another sum','(−, +)' in await page.locator('.set-construction').nth(1).inner_text())
            await reveal()
            await check('global reverse difference accepted',await page.locator('[data-set-status]').get_attribute('data-set-status')=='complete-valid')
            await page.locator('#operation-xz').click()
            await check('operation selection retained',await page.locator('#operation-xz').get_attribute('aria-pressed')=='true')
            await check('operation control keeps focus',await page.evaluate("document.activeElement.id==='operation-xz'"))
            await page.evaluate("window.mutations=0;new MutationObserver(r=>window.mutations+=r.length).observe(live,{childList:true,characterData:true,subtree:true})")
            await page.locator('#axes').uncheck();await page.locator('#guides').uncheck();await page.wait_for_timeout(30)
            await check('view settings do not repeat announcement',await page.evaluate('mutations===0'))
            patterns=await page.locator('.set-construction .pattern').all_text_contents()
            await page.locator('#reset-check').click()
            await check('explanation reset preserves learner patterns',await page.locator('.set-construction .pattern').all_text_contents()==patterns)
            await check('explanation reset focuses check action',await page.evaluate("document.activeElement.id==='check-set'"))
            await page.locator('#edit-sum').click();await page.locator('#flip').click();await page.locator('#next').click();await page.locator('#next').click();await reveal()
            await check('both global reversals accepted',await page.locator('[data-set-status]').get_attribute('data-set-status')=='complete-valid')
            await check('axes preference survives editing',not await page.locator('#axes').is_checked())
            await check('guides preference survives editing',not await page.locator('#guides').is_checked())
            await check('one persistent live region',await page.locator('[role="status"]').count()==1)
            await check('original live node connected',await page.evaluate("live===document.querySelector('#guided-announcements')&&live.isConnected"))
            await check('unique document IDs',await page.evaluate("(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return ids.length===new Set(ids).size})()"))
            await check('no horizontal overflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            layout=await page.evaluate("(()=>{const a=document.querySelector('.view-card').getBoundingClientRect(),b=document.querySelector('#lesson').getBoundingClientRect();return {stacked:b.top>=a.bottom,columns:b.left>a.left}})()")
            await check('mobile-first panel order',layout['stacked'] if width==380 else layout['columns'])
            if screenshots:
                Path(screenshots).mkdir(parents=True,exist_ok=True)
                await page.screenshot(path=str(Path(screenshots)/f'step5-{width}.png'),full_page=True)
            await page.locator('#edit-sum').click();await page.locator('#reset').click();await page.locator('#next').click();await page.locator('#next').click()
            await check('old success removed after reset',await page.locator('[data-set-status]').count()==0)
            await reveal()
            await check('rechecked changed state is incomplete',await page.locator('[data-set-status]').get_attribute('data-set-status')=='incomplete')
            await page.evaluate("document.documentElement.style.fontSize='200%'")
            await check('enlarged root-text reflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            await check('no JavaScript errors',not errors)
            await page.close()
        version=browser.version;await browser.close()
    return {"browser":"Chromium "+version,"passed":sum(c['passed'] for c in checks),"failed":sum(not c['passed'] for c in checks),"checks":checks}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('url');parser.add_argument('--screenshots');args=parser.parse_args()
    report=asyncio.run(run(args.url,args.screenshots));print(json.dumps(report,indent=2));raise SystemExit(int(report['failed']>0))
