"""Verify installed Batch A/B source without rewriting tracked files; emit CI evidence."""
import argparse
import functools
import hashlib
import http.server
import importlib.metadata
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import traceback
import urllib.parse
import zipfile
from html.parser import HTMLParser

class ScreenParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]
        self.refs=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        for key in ['aria-labelledby','aria-describedby','aria-controls']:
            self.refs.extend(attrs.get(key,'').split())
        if tag=='label' and attrs.get('for'):self.refs.append(attrs['for'])

def check_screens(path):
    screens=json.loads(path.read_text())
    if not isinstance(screens,list) or len(screens)!=60:raise AssertionError('Expected 60 UI states: 5 steps x 2 axes x 2 guides x 3 phase states')
    for i,markup in enumerate(screens):
        parser=ScreenParser();parser.feed(markup)
        if len(parser.ids)!=len(set(parser.ids)):raise AssertionError(f'Duplicate ID in state {i}')
        if set(parser.refs)-set(parser.ids):raise AssertionError(f'Unresolved ARIA/label target in state {i}')
    return {'screensChecked':len(screens),'uniqueIds':True,'resolvedReferences':True}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--apply-recipe',action='store_true',help='Legacy compatibility flag; installed source is required and no recipe is applied')
    ap.parse_args()
    root=Path(__file__).resolve().parents[1]
    tracked=[p for p in subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0') if p]
    def hashes():return {p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in tracked if (root/p).is_file()}
    before=hashes()
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    out=root/'verification-output';out.mkdir(exist_ok=True)
    report={'sourceCommit':head,'mode':'installed-source-no-rewrite','startedUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'checks':[]}
    def command(name,argv,env=None,timeout=180):
        start=time.monotonic()
        try:
            p=subprocess.run(argv,cwd=root,env=env,capture_output=True,text=True,timeout=timeout)
            result={'name':name,'command':argv,'exitCode':p.returncode,'seconds':round(time.monotonic()-start,3),'stdout':p.stdout,'stderr':p.stderr}
        except Exception as exc:
            result={'name':name,'command':argv,'exitCode':1,'seconds':round(time.monotonic()-start,3),'stdout':'','stderr':repr(exc)}
        report['checks'].append(result)
        (out/(name+'.log')).write_text(result['stdout']+'\n'+result['stderr'])
        print(f"{name}: {'PASS' if result['exitCode']==0 else 'FAIL'}",flush=True)
        print(result['stdout'],flush=True)
        if result['stderr']:print(result['stderr'],file=sys.stderr,flush=True)
        return result
    server=None
    try:
        command('node-version',['node','--version'])
        command('npm-version',['npm','--version'])
        report['python']=sys.version
        report['playwright']=importlib.metadata.version('playwright')
        if not (root/'src/engine/hardening.js').is_file():raise RuntimeError('Installed hardening source required; this runner never reapplies the recovery recipe')
        scripts=json.loads((root/'package.json').read_text())['scripts']
        required={'test':['tests/run.mjs','tests/stage2.mjs','tests/hardening.mjs','tests/ui-zero.mjs','tests/step5.mjs'],'test:ui':['tests/ui-preview.mjs','tests/ui-zero.mjs','tests/step5.mjs']}
        for key,paths in required.items():
            if any(('node '+p) not in scripts.get(key,'') for p in paths):raise RuntimeError(f'Missing permanent test wiring in {key}; package.json was not rewritten')
        report['checks'].append({'name':'permanent-test-wiring','exitCode':0})
        syntax=[]
        for p in sorted((root/'src').rglob('*'))+sorted((root/'tests').glob('*.mjs')):
            if p.suffix in ['.js','.mjs']:
                r=subprocess.run(['node','--check',str(p)],capture_output=True,text=True)
                syntax.append({'file':str(p.relative_to(root)),'exitCode':r.returncode,'stderr':r.stderr})
        for p in sorted((root/'scripts').glob('*.py'))+sorted((root/'tests').glob('*.py')):
            try:compile(p.read_text(),str(p),'exec');syntax.append({'file':str(p.relative_to(root)),'exitCode':0})
            except Exception as exc:syntax.append({'file':str(p.relative_to(root)),'exitCode':1,'stderr':repr(exc)})
        report['syntax']=syntax
        report['checks'].append({'name':'syntax','exitCode':int(any(r['exitCode'] for r in syntax))})
        command('npm-test',['npm','test'])
        dump=out/'ui-states.json'
        if dump.exists():dump.unlink()
        env={**os.environ,'UI_RENDER_DUMP':str(dump)}
        command('npm-test-ui',['npm','run','test:ui'],env=env)
        try:report['screenValidation']=check_screens(dump);code=0
        except Exception as exc:report['screenValidation']={'error':repr(exc)};code=1
        report['checks'].append({'name':'screen-ids-aria','exitCode':code})
        class Handler(http.server.SimpleHTTPRequestHandler):
            def log_message(self,fmt,*values):
                with (out/'http.log').open('a') as log:log.write((fmt%values)+'\n')
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root.parent)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=f'http://127.0.0.1:{server.server_port}/{urllib.parse.quote(root.name)}/'
        report['localURL']=url
        suites=[('browser-announcements','tests/browser-announcements.py',[]),('browser-step4','tests/browser-step4.py',['--screenshots',str(out/'screenshots')]),('browser-step5','tests/browser-step5.py',['--screenshots',str(out/'screenshots')])]
        for name,path,extra in suites:
            result=command(name,[sys.executable,path,url]+extra)
            try:
                browser_report=json.loads(result['stdout'])
                report[name]=browser_report
                if browser_report.get('failed')!=0 or not isinstance(browser_report.get('passed'),int) or browser_report['passed']<=0:raise ValueError('Browser report missing successful checks or reports failures')
            except Exception as exc:
                result['exitCode']=1;result['reportParseError']=repr(exc)
    except Exception:
        report['fatalError']=traceback.format_exc()
        report['checks'].append({'name':'verification-setup','exitCode':1})
        print(report['fatalError'],file=sys.stderr)
    finally:
        if server:server.shutdown();server.server_close()
        after=hashes()
        report['sourceHashesBefore']=before
        report['sourceHashesAfter']=after
        report['changedLocally']=[p for p in sorted(set(before)|set(after)) if before.get(p)!=after.get(p)]
        report['checks'].append({'name':'tracked-source-unchanged','exitCode':int(before!=after)})
        try:
            overlay=[p for p in tracked if p.startswith(('src/ui/','tests/','docs/','.github/workflows/')) or p in ['package.json','README.md','scripts/verify_batch_a.py','requirements-verification.txt','src/engine/hardening.js']]
            for name,paths in [('applied-source.zip',tracked),('source-overlay.zip',overlay)]:
                with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
                    for p in paths:
                        if (root/p).is_file():z.write(root/p,p)
                with zipfile.ZipFile(out/name) as z:
                    if z.testzip() is not None:raise RuntimeError('Archive integrity failure')
            patch=subprocess.run(['git','diff','--binary','HEAD'],cwd=root,capture_output=True,text=True,check=True)
            (out/'applied-tracked-files.patch').write_text(patch.stdout)
            report['patchNote']='Installed source is tracked; a successful no-rewrite run has no tracked-file changes. ZIPs contain the tested source.'
        except Exception:
            report['artifactError']=traceback.format_exc()
            report['checks'].append({'name':'artifacts','exitCode':1})
        report['passed']=sum(r['exitCode']==0 for r in report['checks'])
        report['failed']=sum(r['exitCode']!=0 for r in report['checks'])
        (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
        summary=f"# Batch A/B installed-source verification\n\nSource commit: `{head}`\n\nMode: `{report['mode']}`\n\n| Check | Result |\n|---|---|\n"
        for r in report['checks']:summary+=f"| {r['name']} | {'PASS' if r['exitCode']==0 else 'FAIL'} |\n"
        summary+='\nLocal Chromium checks only: no live Pages, actual screen-reader speech, Firefox/WebKit, native zoom or real touch verification. The runner does not commit, push, merge or deploy.\n'
        (out/'SUMMARY.md').write_text(summary)
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write(summary)
    return int(report['failed']>0)

if __name__=='__main__':raise SystemExit(main())
