"""Recovery checkpoint only. Reconstructed; not applied or integration-verified."""
import argparse
import hashlib
from pathlib import Path

BASE = 'aedaa64cca01a1ec047d37e7c6b283247da49b0a'
HASHES = {
    'src/engine/grading.js': 'ad2671a3793c9f5d70c0d4be19c34c2b24d50b04',
    'src/engine/completeset.js': '74779b6d4c97e15d0d9e50e1b80c414a1119cca4',
    'src/engine/feedback.js': 'eaa522e2ddf716703cc3dc63b5a743ca77bcae24',
    'src/ui/view.mjs': '5bf8a148d2e699dade61c7410cdd5fb74dd41bf7',
    'tests/stage2.mjs': 'e188cf7641f4b220aba501f8edc0872b9b35ab57',
    'package.json': '623e5870dcdad0537d8ea6714de095ddd882b51d',
}

GUARDS = r'''import {orbitalRep} from './symmetry.js';
import {decompose} from './irreps.js';
import {fb} from './feedback.js';
export function inspectSetInput(model,patterns){
 const incomplete=()=>({status:'incomplete',issues:[{type:'count',detail:`need ${model.n} fully specified patterns`}]});
 const invalid=()=>({status:'invalid',issues:[{type:'malformed-pattern'}]});
 if(!Array.isArray(patterns))return invalid();
 let missing=patterns.length!==model.n;
 for(const p of Array.from(patterns)){
  if(p===null||p===undefined){missing=true;continue;}
  if(!Array.isArray(p))return invalid();
  if(p.length!==model.n)missing=true;
  for(const x of Array.from(p)){if(x===null||x===undefined)missing=true;else if(![-1,0,1].includes(x))return invalid();}
 }
 return missing?incomplete():null;
}
export function validateOccupancies(system,occ){
 const issues=[],values=Object.create(null);
 if(occ===null||typeof occ!=='object'||Array.isArray(occ)||![Object.prototype,null].includes(Object.getPrototypeOf(occ)))return {ok:false,issues:[{type:'occupancy-map'}],values};
 const known=new Set(system.mos.map(m=>m.id));
 for(const key of Reflect.ownKeys(occ)){
  if(typeof key!=='string'||!known.has(key)){issues.push({type:'unknown-orbital',orbital:String(key)});continue;}
  const d=Object.getOwnPropertyDescriptor(occ,key);
  if(!Object.hasOwn(d,'value')){issues.push({type:'invalid-occupancy',orbital:key});continue;}
  const n=d.value;
  if(typeof n!=='number'||!Number.isFinite(n)||!Number.isInteger(n)||n<0)issues.push({type:'invalid-occupancy',orbital:key});
  else if(n>2)issues.push({type:'overfull',orbital:key});else values[key]=n;
 }
 for(const id of known)if(!Object.hasOwn(values,id))values[id]=0;
 return {ok:issues.length===0,issues,values};
}
export function guardFilling(system,occ,grade){
 const r=validateOccupancies(system,occ);
 if(r.ok)return grade(system,r.values);
 const invalid=r.issues.some(i=>i.type!=='overfull');
 return {status:invalid?'invalid-input':'overfull',issues:r.issues,messages:[invalid?fb('F5',{issues:r.issues}):fb('F2',{orbitals:r.issues.map(i=>i.orbital)})]};
}
export function deriveCentral(model,sampled){
 const out={},axes={px:[1,0,0],py:[0,1,0],pz:[0,0,1]};
 for(const c of model.central){
  let irrep=sampled[c.id],source=irrep?'ligand-coupling':'unresolved';const dir=axes[c.id];
  const preserved=dir&&model.group.elements.every(R=>{const v=R.map(row=>row.reduce((s,x,i)=>s+x*dir[i],0));return [1,-1].some(sign=>v.every((x,i)=>Math.abs(x-sign*dir[i])<1e-9));});
  if(c.id==='s'||preserved){const [d]=decompose(model.group,orbitalRep(model.group,[{pos:[0,0,0],dir:dir||null}]),model.spec.labelRules);if(model.spec.labelRules.some(r=>r.name===d.name)){irrep=d.name;source='ao-transformation';}}
  out[c.id]={irrep,sampledIrrep:c.irrep,zeroLigandCoupling:c.vec.every(x=>Math.abs(x)<1e-9),source};
 }
 const co=model.spec.centralOrbital;if(co)out[co.id]={irrep:sampled[co.id],sampledIrrep:null,zeroLigandCoupling:null,source:sampled[co.id]?'ao-transformation':'unresolved'};
 return out;
}
export function guardMatching(model,course,input,grade,key){
 const blocked=reason=>({status:'blocked',reason,courseOk:false,messages:[]});
 if(!input||typeof input!=='object'||Array.isArray(input))return blocked('invalid matching input');
 if(input.selected!==undefined&&(!Array.isArray(input.selected)||Array.from(input.selected).some(id=>typeof id!=='string')))return blocked('invalid central selection');
 if(input.none!==undefined&&typeof input.none!=='boolean')return blocked('invalid nonbonding selection');
 if(input.none&&input.selected?.length)return blocked('conflicting selections');
 if(input.lgoId!==undefined){
  if(input.pattern!==undefined)return blocked('choose lgoId or pattern, not both');
  if(!course.lgos.some(l=>l.id===input.lgoId))return blocked('unknown course LGO');
 }else{
  if(!Array.isArray(input.pattern)||input.pattern.length!==model.n||Array.from(input.pattern).some(x=>![-1,0,1].includes(x)))return blocked('invalid or incomplete sign pattern');
  if(!course.lgos.some(l=>key(l.pattern)===key(input.pattern)))return {...blocked('noncanonical sign-only matching requires coefficient-level support'),messages:[fb('X3')]};
 }
 return grade(model,course,input);
}
export function guardConstruction(model,course,patterns,grade){
 const r=inspectSetInput(model,patterns);
 return r?{status:r.status,set:r,perSlot:[],courseMatchedCount:0,courseTotal:course.lgos.length,courseAligned:false,messages:[fb(r.status==='incomplete'?'S1':'S4')]}:grade(model,course,patterns);
}
'''

WRAPPERS = r'''
export {validateOccupancies} from './hardening.js';
export function centralSymmetry(model){return deriveCentral(model,sampledCentralIrreps(model));}
export function centralIrreps(model){return Object.fromEntries(Object.entries(centralSymmetry(model)).map(([id,v])=>[id,v.irrep]));}
export function gradeFilling(system,occ){return guardFilling(system,occ,gradeFillingUnchecked);}
export function gradeMatching(model,course,input){return guardMatching(model,course,input,gradeMatchingUnchecked,patternKey);}
export function gradeConstruction(model,course,patterns){return guardConstruction(model,course,patterns,gradeConstructionUnchecked);}
'''

def blob(raw):
    return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()

def once(text,old,new):
    if text.count(old)!=1:
        raise ValueError('Replacement anchor mismatch: '+old[:100])
    return text.replace(old,new)

def prepare(root):
    pending={}
    for path,sha in HASHES.items():
        target=root/path
        if target.is_symlink() or not target.resolve().is_relative_to(root):
            raise ValueError('Unsafe target: '+path)
        raw=target.read_bytes()
        if blob(raw)!=sha:
            raise ValueError('Baseline mismatch; no files written: '+path)
        pending[path]=raw.decode('utf-8')
    p='src/engine/grading.js';s=pending[p]
    for name,new in [('centralIrreps','sampledCentralIrreps'),('gradeFilling','gradeFillingUnchecked'),('gradeMatching','gradeMatchingUnchecked'),('gradeConstruction','gradeConstructionUnchecked')]:
        s=once(s,'export function '+name+'(', 'function '+new+'(')
    pending[p]="import {deriveCentral,guardFilling,guardMatching,guardConstruction} from './hardening.js';\n"+s+WRAPPERS
    p='src/engine/completeset.js';s=pending[p]
    start=s.index('  if (patterns.length !== n')
    end=s.index('  const issues = [];',start)
    s=s[:start]+"  const input=inspectSetInput(model,patterns);\n  if(input)return input;\n"+s[end:]
    pending[p]="import {inspectSetInput} from './hardening.js';\n"+s
    p='src/engine/feedback.js';s=pending[p]
    s=once(s,"  X3: ['course', 'course statement', 'This valid LGO pairs with a combination of the central orbitals, not with the single canonical one.'],","  X3: ['model', 'model assumption', 'Noncanonical sign-only matching is not graded without coefficient-level support.'],")
    pending[p]=once(s,'  B1: [',"  F5: ['validity', 'convention', 'Occupancies must map known orbital IDs to integers 0, 1 or 2; omitted IDs mean zero.'],\n  S4: ['validity', 'convention', 'Construction inputs must use sign arrays of -1, 0 and 1; missing entries remain unanswered.'],\n  B1: [")
    p='src/ui/view.mjs';s=pending[p]
    start=s.index(" if(b===null)return")
    end=s.index('\n}',start)
    s=s[:start]+" const describe=v=>v===null?'unanswered (not zero)':v===0?'zero coefficient (no lobe)':v>0?'positive':'negative';\n const relative=b===null||a===0||b===0?'':` ${a*b>0?'Same':'Opposite'} relative phase.`;\n return `Hₐ ${describe(a)}; Hᵦ ${describe(b)}.${relative}`;"+s[end:]
    pending[p]=once(s,'    else svg+=`<circle data-site="${i}"','    else if(value===0)svg+=`<text data-zero-site="${i}" x="${x}" y="${y+6}" text-anchor="middle" fill="#293a35" font-size="12">0 · no lobe</text>`;\n    else svg+=`<circle data-site="${i}"')
    p='tests/stage2.mjs';s=pending[p]
    s=once(s,'ok(cir[c] === null || neglected,','ok(!m.irreps.some(ir=>ir.name===cir[c]) || neglected,')
    s=once(s,"ok(r.status === 'correct' && r.rotated && r.messages.some((x) => x.code === 'X3'), 'SF6 rotated T1u pairs with a px+py combination (X3, valid)');","ok(r.status === 'blocked' && r.messages.some(x=>x.code==='X3'), 'Noncanonical matching is explicitly ungraded');")
    pending[p]=once(s,'// 9. Every feedback code is reachable',"note(gradeFilling(buildCourseSystem(M.h2o,COURSE.h2o),{ghost:2}));\nnote(gradeConstruction(M.h2o,COURSE.h2o,[[1,2],[1,-1]]));\n\n// 9. Every feedback code is reachable")
    p='package.json';pending[p]=once(pending[p],'"test": "node tests/run.mjs && node tests/stage2.mjs",','"test": "node tests/run.mjs && node tests/stage2.mjs",\n    "test:hardening": "node tests/hardening.mjs",')
    if (root/'src/engine/hardening.js').exists():
        raise ValueError('New-file collision: src/engine/hardening.js')
    pending['src/engine/hardening.js']=GUARDS
    return pending

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkout',nargs='?',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--apply',action='store_true')
    args=parser.parse_args();root=args.checkout.resolve()
    pending=prepare(root)
    if args.apply:
        for path,text in pending.items():
            target=root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text,encoding='utf-8')
    print(('APPLIED' if args.apply else 'DRY RUN')+': '+', '.join(sorted(pending)))
    print('Full integration verification and companion hardening regressions remain pending. No git or deployment action performed.')

if __name__=='__main__':
    main()
