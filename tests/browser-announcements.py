import argparse
import asyncio
import json
from playwright.async_api import async_playwright

async def run(url):
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in [380,1280]:
            page=await browser.new_page(viewport={"width":width,"height":900})
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            async def check(name,passed):
                results.append({"width":width,"test":name,"passed":bool(passed)})
            async def persistent():
                return await page.evaluate("originalLive===document.querySelector('#guided-announcements') && originalLive.isConnected")
            async def check_visible_feedback(context):
                phase=(await page.locator('.status').text_content()).strip()
                notice=page.locator('#lesson > .callout')
                await check(context+' has one visible dependency notice',await notice.count()==1)
                notice_text=(await notice.text_content()).strip()
                await check(context+' notice identifies cleared later answers',notice_text=='Ligand construction changed. All later H₂O answers and checks were cleared.')
                live=(await page.locator('#guided-announcements').text_content()).strip()
                await check(context+' phase and dependency notice announced together',live==phase+' '+notice_text)
            await page.goto(url,wait_until="networkidle")
            await page.wait_for_selector("#next")
            await page.evaluate("""() => {
                window.originalLive=document.querySelector('#guided-announcements');
                window.liveMutations=0;
                new MutationObserver(records=>window.liveMutations+=records.length).observe(originalLive,{childList:true,characterData:true,subtree:true});
            }""")
            await check("live node starts empty",await page.locator("#guided-announcements").text_content()=="")
            await page.locator("#next").click()
            await page.locator("#next").click()
            await check("live node persists across navigation",await persistent())
            await check("only one live status region",await page.locator('[role="status"]').count()==1)
            await check("visible status is not a second live region",await page.locator('.status[aria-live],.status[role="status"]').count()==0)
            await page.locator("#same").focus()
            await page.keyboard.press("Enter")
            await check_visible_feedback('assignment')
            await check("assignment node stays connected",await persistent())
            await check("focus moves to flip",await page.evaluate("document.activeElement.id==='flip'"))
            await page.keyboard.press("Space")
            await check("flip message updates",'Both signs reversed' in await page.locator("#guided-announcements").text_content())
            await check_visible_feedback('global flip')
            await check("flip node stays connected",await persistent())
            before=await page.evaluate("liveMutations")
            await page.locator("#axes").uncheck()
            await page.locator("#guides").uncheck()
            await page.wait_for_timeout(30)
            await check("view toggles do not rewrite announcement",await page.evaluate("liveMutations")==before)
            await check("toggle retains focus",await page.evaluate("document.activeElement.id==='guides'"))
            await check("view toggles preserve live node",await persistent())
            await page.locator("#back").click()
            await check("navigation clears stale text",await page.locator("#guided-announcements").text_content()=="")
            await page.locator("#next").click()
            await check("return does not repeat stale phase",await page.locator("#guided-announcements").text_content()=="")
            await check("return keeps live node",await persistent())
            await page.locator("#reset").click()
            await check("reset announcement updated",'unanswered' in await page.locator("#guided-announcements").text_content())
            await check_visible_feedback('reset')
            await check("reset restores assignment focus",await page.evaluate("document.activeElement.id==='same'"))
            await check("reset keeps axes preference",not await page.locator("#axes").is_checked())
            await check("reset keeps guides preference",not await page.locator("#guides").is_checked())
            before=await page.evaluate("liveMutations")
            await page.locator("#reset").click()
            await page.wait_for_timeout(30)
            await check("identical message is not rewritten",await page.evaluate("liveMutations")==before)
            await check("final live node remains original",await persistent())
            await check("no JavaScript errors",not errors)
            await page.close()
        version=browser.version
        await browser.close()
    report={"browser":"Chromium "+version,"checks":results,"passed":sum(r["passed"] for r in results),"failed":sum(not r["passed"] for r in results)}
    return report

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("url",help="HTTP URL of the served LGO repository")
    args=parser.parse_args()
    report=asyncio.run(run(args.url))
    print(json.dumps(report,indent=2))
    raise SystemExit(1 if report["failed"] else 0)
