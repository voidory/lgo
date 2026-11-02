"""Run Batch A in a complete checkout; write reports and source artifacts, never git commits."""
import argparse
import functools
import hashlib
import html
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
    if not isinstance(screens,list) or len(screens)!=48:raise AssertionError('Expected 48 UI states')
    for i,markup in enumerate(screens):
        parser=ScreenParser();parser.feed(markup)
        if len(parser.ids)!=len(set(parser.ids)):raise AssertionError(f'Duplicate ID in state {i}')
        if set(parser.refs)-set(parser.ids):raise AssertionError(f'Unresolved ARIA/label target in state {i}')
    return {'screensChecked':len(screens),'uniqueIds':True,'resolvedReferences':True}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--apply-recipe',action='store_true')
    args=ap.parse_args()
    root=Path(__file__).resolve().parents[1]
    tracked=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
    tracked=[p for p in tracked if p]
    before={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in tracked if (root/p).is_file()}
    head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
    out=root/'verification-output';out.mkdir(exist_ok=True)
    report={'sourceCommit':head,'startedUTC':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'checks':[]}
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
        try:report['playwright']=importlib.metadata.version('playwright')
        except importlib.metadata.PackageNotFoundError:report['playwright']='not installed'
        helper=root/'src/engine/hardening.js'
        if not helper.exists():
            if not args.apply_recipe:raise RuntimeError('Hardening not installed: use --apply-recipe in a disposable checkout')
            result=command('apply-recipe',[sys.executable,'scripts/hardening_recovery.py','--apply'])
            if result['exitCode']:raise RuntimeError('Recovery application failed; applied tests were not run')
            report['mode']='recipe-applied-locally'
        else:report['mode']='already-applied-source'
        package_path=root/'package.json'
        package=json.loads(package_path.read_text())
        scripts=package['scripts']
        for test in ['tests/hardening.mjs','tests/ui-zero.mjs']:
            if test not in scripts['test']:scripts['test']+=' && node '+test
        scripts['test:hardening']='node tests/hardening.mjs'
        scripts['test:ui']='node tests/ui-preview.mjs && node tests/ui-zero.mjs'
        package_path.write_text(json.dumps(package,indent=2)+'\n')
        report['testWiringUpdatedLocally']=True
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
        env={**os.environ,'UI_RENDER_DUMP':str(out/'ui-states.json')}
        command('ui-preview',['node','tests/ui-preview.mjs'],env=env)
        try:report['screenValidation']=check_screens(out/'ui-states.json');code=0
        except Exception as exc:report['screenValidation']={'error':repr(exc)};code=1
        report['checks'].append({'name':'screen-ids-aria','exitCode':code})
        class Handler(http.server.SimpleHTTPRequestHandler):
            def log_message(self,fmt,*values):
                with (out/'http.log').open('a') as log:log.write((fmt%values)+'\n')
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root.parent)))
        threading.Thread(target=server.serve_forever,daemon=True).start()
        url=f'http://127.0.0.1:{server.server_port}/{urllib.parse.quote(root.name)}/'
        report['localURL']=url
        for name,path,extra in [('browser-announcements','tests/browser-announcements.py',[]),('browser-step4','tests/browser-step4.py',['--screenshots',str(out/'screenshots')])]:
            result=command(name,[sys.executable,path,url]+extra)
            try:
                browser_report=json.loads(result['stdout'])
                report[name]=browser_report
                if browser_report.get('failed',0):result['exitCode']=1
            except Exception as exc:
                result['exitCode']=1;result['reportParseError']=repr(exc)
    except Exception:
        report['fatalError']=traceback.format_exc()
        report['checks'].append({'name':'verification-setup','exitCode':1})
        print(report['fatalError'],file=sys.stderr)
    finally:
        if server:server.shutdown();server.server_close()
        helper='src/engine/hardening.js'
        source_paths=sorted(set(tracked+([helper] if (root/helper).is_file() else [])))
        after={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in source_paths if (root/p).is_file()}
        report['sourceHashesBefore']=before
        report['sourceHashesAfter']=after
        report['changedLocally']=[p for p in after if before.get(p)!=after[p]]
        overlay=set(report['changedLocally'])|{'tests/hardening.mjs','tests/ui-zero.mjs','scripts/verify_batch_a.py','requirements-verification.txt','docs/BATCH-A.md','.github/workflows/batch-a.yml'}
        try:
            for name,paths in [('applied-source.zip',source_paths),('source-overlay.zip',sorted(overlay))]:
                with zipfile.ZipFile(out/name,'w',zipfile.ZIP_DEFLATED) as z:
                    for p in paths:
                        if (root/p).is_file():z.write(root/p,p)
                with zipfile.ZipFile(out/name) as z:
                    if z.testzip() is not None:raise RuntimeError('Archive integrity failure')
            patch=subprocess.run(['git','diff','--binary'],cwd=root,capture_output=True,text=True)
            (out/'applied-tracked-files.patch').write_text(patch.stdout)
            report['patchNote']='The untracked hardening.js module is included in both ZIPs, not in git diff.'
        except Exception:
            report['artifactError']=traceback.format_exc()
            report['checks'].append({'name':'artifacts','exitCode':1})
        report['passed']=sum(r['exitCode']==0 for r in report['checks'])
        report['failed']=sum(r['exitCode']!=0 for r in report['checks'])
        (out/'report.json').write_text(json.dumps(report,indent=2)+'\n')
        summary=f"# Batch A verification\n\nSource commit: `{head}`\n\nMode: `{report.get('mode','setup-failed')}`\n\n| Check | Result |\n|---|---|\n"
        for r in report['checks']:summary+=f"| {r['name']} | {'PASS' if r['exitCode']==0 else 'FAIL'} |\n"
        summary+='\nLocal checks only: no live Pages, actual screen-reader speech, Firefox/WebKit, native zoom or real touch verification. No repository commit, push or deployment was performed by this runner.\n'
        (out/'SUMMARY.md').write_text(summary)
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as f:f.write(summary)
    return 1 if report['failed'] else 0

if __name__=='__main__':raise SystemExit(main())
