import argparse
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

async def run(url,screenshot_dir=None):
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in [380,1280]:
            page=await browser.new_page(viewport={"width":width,"height":900},reduced_motion="reduce")
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            async def check(test,passed):results.append({"width":width,"test":test,"passed":bool(passed)})
            await page.goto(url,wait_until="networkidle")
            await page.wait_for_selector("#next")
            await page.evaluate("window.originalLive=document.querySelector('#guided-announcements')")
            await check("Back disabled at start",await page.locator("#back").is_disabled())
            await page.locator("#next").click();await page.locator("#next").click()
            await page.locator("#same").click();await page.locator("#flip").click()
            await check("Step 3 global reverse still works",await page.locator(".phase-minus").count()==2)
            await page.locator("#next").focus();await page.keyboard.press("Enter")
            await check("Step 4 title loaded",'Build the out-of-phase LGO' in await page.locator("#step-title").inner_text())
            await check("heading focused on entry",await page.evaluate("document.activeElement.id==='step-title'"))
            await check("canonical reference starts positive pair",await page.locator(".phase-plus").count()==2)
            await check("flip disabled until difference built",await page.locator("#flip").is_disabled())
            await check("implemented Step 5 navigation available",await page.locator("#next").count()==1)
            await page.locator("#opposite").focus();await page.keyboard.press("Enter")
            await check("difference has one positive lobe",await page.locator(".phase-plus").count()==1)
            await check("difference has one negative lobe",await page.locator(".phase-minus").count()==1)
            await check("negative lobe has hatch",await page.locator('circle[fill="url(#hatch)"]').count()==1)
            await check("Ha stays positive",'phase-plus' in await page.locator('[data-site="0"]').get_attribute("class"))
            await check("Hb becomes negative",'phase-minus' in await page.locator('[data-site="1"]').get_attribute("class"))
            await check("difference formula appears",await page.locator(".formula").inner_text()=='L₋ ∝ 1s(Hₐ) − 1s(Hᵦ)')
            await check("assignment focus moves to flip",await page.evaluate("document.activeElement.id==='flip'"))
            await check("persistent announcement text updates",'Opposite relative signs' in await page.locator("#guided-announcements").inner_text())
            await check("only one live status",await page.locator('[role="status"]').count()==1)
            await check("live node remains original",await page.evaluate("originalLive===document.querySelector('#guided-announcements')&&originalLive.isConnected"))
            await check("no horizontal overflow",await page.evaluate("document.documentElement.scrollWidth<=innerWidth"))
            layout=await page.evaluate("""() => {const v=document.querySelector('.view-card').getBoundingClientRect(),l=document.querySelector('#lesson').getBoundingClientRect();return {stacked:l.top>=v.bottom,columns:l.left>v.left}}""")
            await check("responsive panel placement",layout['stacked'] if width==380 else layout['columns'])
            if screenshot_dir:
                Path(screenshot_dir).mkdir(parents=True,exist_ok=True)
                await page.screenshot(path=str(Path(screenshot_dir)/f'step4-{width}-difference.png'),full_page=True)
            await page.locator("#back").click()
            await check("Step 3 saved signs remain unchanged",await page.locator(".phase-minus").count()==2)
            await page.locator("#next").click()
            await check("difference survives navigation",await page.locator(".phase-minus").count()==1)
            await page.locator("#flip").focus();await page.keyboard.press("Space")
            await check("whole difference flips Ha",'phase-minus' in await page.locator('[data-site="0"]').get_attribute("class"))
            await check("whole difference flips Hb",'phase-plus' in await page.locator('[data-site="1"]').get_attribute("class"))
            await check("equivalent formula appears",await page.locator(".formula").inner_text()=='−L₋ ∝ −1s(Hₐ) + 1s(Hᵦ)')
            await page.locator("#axes").uncheck();await page.locator("#guides").uncheck()
            await page.locator("#reset").click()
            await check("Step 4 reset returns canonical reference",await page.locator(".phase-plus").count()==2)
            await check("reset focus moves to opposite action",await page.evaluate("document.activeElement.id==='opposite'"))
            await check("reset preserves axes",not await page.locator("#axes").is_checked())
            await check("reset preserves guides",not await page.locator("#guides").is_checked())
            await page.locator("#back").click()
            await check("Step 4 reset does not reset Step 3",await page.locator(".phase-minus").count()==2)
            await page.locator("#next").click()
            await page.evaluate("document.documentElement.style.fontSize='200%'")
            await check("enlarged root text reflows",await page.evaluate("document.documentElement.scrollWidth<=innerWidth"))
            await check("no page JavaScript errors",not errors)
            await page.close()
        version=browser.version;await browser.close()
    return {"browser":"Chromium "+version,"passed":sum(r['passed'] for r in results),"failed":sum(not r['passed'] for r in results),"checks":results}

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument('url');parser.add_argument('--screenshots')
    args=parser.parse_args();report=asyncio.run(run(args.url,args.screenshots))
    print(json.dumps(report,indent=2));raise SystemExit(1 if report['failed'] else 0)
