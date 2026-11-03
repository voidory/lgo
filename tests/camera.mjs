import assert from 'node:assert/strict';
import {freshCamera,DEFAULT_CAMERA,CAMERA_LIMITS,reduceCamera,cameraFrame,cameraPosition,projectPoint} from '../src/ui/camera.mjs';
const pure=process.argv.includes('--pure');
assert.ok(process.argv.slice(2).every(a=>a==='--pure'));
let passed=0;
const eq=(a,b)=>{assert.deepEqual(a,b);passed++;};
const near=(a,b)=>{assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);passed++;};
const fails=fn=>{assert.throws(fn);passed++;};
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const c=freshCamera();eq(c,DEFAULT_CAMERA);eq(c===freshCamera(),false);
eq(reduceCamera(c,{type:'unknown'}),c);eq(reduceCamera(c,{type:'camera-reset'}),c);
const rotated=reduceCamera(c,{type:'camera-rotate',deltaYaw:Math.PI/2,deltaPitch:0});near(rotated.yaw,Math.PI/2);eq(c,DEFAULT_CAMERA);
const limited=reduceCamera(c,{type:'camera-set',value:{yaw:5*Math.PI,pitch:100,zoom:100}});near(limited.yaw,-Math.PI);eq(limited.pitch,CAMERA_LIMITS.maxPitch);eq(limited.zoom,3);
eq(reduceCamera(c,{type:'camera-zoom',factor:0.01}).zoom,0.5);eq(reduceCamera(c,{type:'camera-zoom',factor:10}).zoom,3);
eq(reduceCamera(rotated,{type:'camera-reset'}),DEFAULT_CAMERA);
for(const bad of [null,undefined,NaN,Infinity,-Infinity,'1']){
 eq(reduceCamera(c,{type:'camera-rotate',deltaYaw:bad,deltaPitch:0}),c);
 eq(reduceCamera(c,{type:'camera-rotate',deltaYaw:0,deltaPitch:bad}),c);
 eq(reduceCamera(c,{type:'camera-zoom',factor:bad}),c);
}
for(const factor of [0,-1])eq(reduceCamera(c,{type:'camera-zoom',factor}),c);
for(const value of [null,[],{},Object.create({yaw:0,pitch:0,zoom:1}),{yaw:0,pitch:0,zoom:0},{yaw:0,pitch:0,zoom:1,extra:1},{yaw:NaN,pitch:0,zoom:1}])eq(reduceCamera(c,{type:'camera-set',value}),c);
let getterCalls=0;const accessor={pitch:0,zoom:1};Object.defineProperty(accessor,'yaw',{get(){getterCalls++;return 0;},enumerable:true});
eq(reduceCamera(c,{type:'camera-set',value:accessor}),c);eq(getterCalls,0);
const max=reduceCamera(c,{type:'camera-zoom',factor:3});eq(reduceCamera(max,{type:'camera-zoom',factor:Number.MAX_VALUE}),max);
for(const yaw of [-3,-1.2,0,0.7,3])for(const pitch of [-1.5,-0.5,0,0.5,1.5]){
 const f=cameraFrame({yaw,pitch,zoom:1});
 for(const axis of [f.right,f.up,f.eye])near(dot(axis,axis),1);
 near(dot(f.right,f.up),0);near(dot(f.right,f.eye),0);near(dot(f.up,f.eye),0);
 cross(f.right,f.up).forEach((x,i)=>near(x,f.eye[i]));
}
const frame=cameraFrame(c);frame.right.forEach((x,i)=>near(x,[1,0,0][i]));frame.up.forEach((x,i)=>near(x,[0,0,1][i]));frame.eye.forEach((x,i)=>near(x,[0,-1,0][i]));
cameraPosition(c).forEach((x,i)=>near(x,[0,-4,0][i]));
const viewport={width:380,height:280,worldSpan:4},point=[1,0,1],before=JSON.stringify({point,viewport,c});
const p=projectPoint(point,c,viewport);near(p.x,260);near(p.y,70);near(p.depth,0);
const origin=projectPoint([0,0,0],rotated,viewport);near(origin.x,190);near(origin.y,140);
const quarter=projectPoint([0,1,0],rotated,viewport);near(quarter.x,260);near(quarter.y,140);
const zoomed=projectPoint(point,{...c,zoom:2},viewport);near(zoomed.x-190,2*(p.x-190));near(zoomed.y-140,2*(p.y-140));
eq(JSON.stringify({point,viewport,c}),before);
fails(()=>projectPoint([1,null,0],c,viewport));fails(()=>projectPoint(new Array(3),c,viewport));fails(()=>projectPoint([1,0,0],c,{width:0,height:10}));fails(()=>projectPoint([1,0,0],c,{...viewport,worldSpan:0}));fails(()=>cameraFrame({...c,zoom:0}));fails(()=>cameraFrame({...c,yaw:Math.PI}));fails(()=>cameraPosition(c,Infinity));
const pureAssertions=passed;
if(!pure){
 const {initialState,reduce,constructionPatterns}=await import('../src/ui/state.mjs');
 const {freshH2O,updateH2O,h2oReference,evaluateH2O}=await import('../src/ui/h2o-model.mjs');
 let w=freshH2O();
 for(const [slot,value] of [[0,['s','pz']],[1,['px']]])w=updateH2O(w,{type:'match',slot,value});
 for(const [slot,value] of [[0,'pz'],[1,'px']])w=updateH2O(w,{type:'partner',slot,value});
 w=updateH2O(w,{type:'neglect',value:'energy'});
 const {system}=h2oReference();
 for(const m of system.mos)w=updateH2O(w,{type:'product',id:m.id,value:m.kind});
 for(const m of system.mos)w=updateH2O(w,{type:'level',id:m.id,value:m.kind==='antibonding'?5:0});
 w=updateH2O(w,{type:'reference',value:true});
 for(const m of system.mos)w=updateH2O(w,{type:'occupancy',id:m.id,value:m.kind==='antibonding'?0:2});
 w=updateH2O(w,{type:'bond-order',value:1});
 const s={...initialState(),step:9,hb:1,difference:{hb:-1,flipped:false},h2o:w,h2oChecks:[true,true,true,true],axes:false,guides:false,notice:'preserve notice'};
 const withoutCamera=q=>{const {camera,...rest}=q;return rest;};
 const snapshot=JSON.stringify(s),verdict=evaluateH2O(s.h2o,constructionPatterns(s));eq(verdict.complete,true);
 for(const action of [{type:'camera-rotate',deltaYaw:0.5,deltaPitch:0.2},{type:'camera-zoom',factor:2},{type:'camera-set',value:{yaw:-1,pitch:0.5,zoom:2}},{type:'camera-reset'}]){
  const q=reduce(s,action);eq(withoutCamera(q),withoutCamera(s));eq(q.h2o,s.h2o);eq(q.h2oChecks,s.h2oChecks);eq(q.completeSet,s.completeSet);eq(evaluateH2O(q.h2o,constructionPatterns(q)),verdict);eq(JSON.stringify(s),snapshot);
 }
 eq(reduce(s,{type:'camera-rotate',deltaYaw:NaN,deltaPitch:0}),s);
 eq(reduce(s,{type:'camera-unknown'}),s);
 const moved=reduce(s,{type:'camera-rotate',deltaYaw:1,deltaPitch:0.2});
 for(const action of [{type:'back'},{type:'axes',value:true},{type:'guides',value:true},{type:'reset-h2o'}])eq(reduce(moved,action).camera,moved.camera);
 for(const type of ['same','flip','reset'])eq(reduce({...moved,step:3}, {type}).camera,moved.camera);
 eq(reduce(moved,{type:'restart'}).camera,freshCamera());eq(initialState().camera===initialState().camera,false);
}
console.log(JSON.stringify({suite:'camera',pureAssertionsPassed:pureAssertions,integrationAssertionsPassed:passed-pureAssertions,integrationExecuted:!pure,assertionsPassed:passed}));
