// Presentation-only orthographic camera. Never transforms learner coefficients or case geometry.
export const CAMERA_LIMITS=Object.freeze({minZoom:0.5,maxZoom:3,maxPitch:Math.PI/2-0.05});
export const DEFAULT_CAMERA=Object.freeze({yaw:0,pitch:0,zoom:1});
export const freshCamera=()=>({...DEFAULT_CAMERA});
const keys=['yaw','pitch','zoom'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const wrap=x=>((x+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
function read(value){
 if(value===null||typeof value!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(value)))return null;
 const own=Reflect.ownKeys(value);
 if(own.length!==3||own.some(k=>!keys.includes(k)))return null;
 const out={};
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!Object.hasOwn(d,'value')||!finite(d.value))return null;out[key]=d.value;}
 return out.zoom>0?out:null;
}
function assertCamera(camera){
 const v=read(camera);
 if(!v)throw new TypeError('Camera must contain finite own yaw, pitch and positive zoom values');
 if(v.yaw< -Math.PI||v.yaw>=Math.PI||Math.abs(v.pitch)>CAMERA_LIMITS.maxPitch||v.zoom<CAMERA_LIMITS.minZoom||v.zoom>CAMERA_LIMITS.maxZoom)throw new RangeError('Camera state must be canonical and within view limits');
 return v;
}
function replace(camera,value){
 const v=read(value);if(!v)return camera;
 const next={yaw:wrap(v.yaw),pitch:clamp(v.pitch,-CAMERA_LIMITS.maxPitch,CAMERA_LIMITS.maxPitch),zoom:clamp(v.zoom,CAMERA_LIMITS.minZoom,CAMERA_LIMITS.maxZoom)};
 return keys.every(k=>next[k]===camera[k])?camera:next;
}
export function reduceCamera(camera,action){
 const v=assertCamera(camera);
 if(!action||typeof action!=='object')return camera;
 switch(action.type){
  case 'camera-set':return replace(camera,action.value);
  case 'camera-rotate':return finite(action.deltaYaw)&&finite(action.deltaPitch)?replace(camera,{...v,yaw:v.yaw+action.deltaYaw,pitch:v.pitch+action.deltaPitch}):camera;
  case 'camera-zoom':return finite(action.factor)&&action.factor>0?replace(camera,{...v,zoom:v.zoom*action.factor}):camera;
  case 'camera-reset':return replace(camera,DEFAULT_CAMERA);
  default:return camera;
 }
}
// Course view looks from -y: +x is screen-right, +z screen-up, +y away from the viewer.
// right x up = eye; changing the camera never relabels the fixed molecular axes.
export function cameraFrame(camera){
 const {yaw,pitch}=assertCamera(camera),sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 return {right:[cy,sy,0],up:[-sp*sy,sp*cy,cp],eye:[cp*sy,-cp*cy,sp]};
}
export function cameraPosition(camera,distance=4){
 if(!finite(distance)||distance<=0)throw new RangeError('Camera distance must be finite and positive');
 return cameraFrame(camera).eye.map(x=>x*distance);
}
export function projectPoint(point,camera,viewport){
 if(!Array.isArray(point)||point.length!==3||!Array.from(point).every(finite))throw new TypeError('Point must contain three finite coordinates');
 if(!viewport||!finite(viewport.width)||viewport.width<=0||!finite(viewport.height)||viewport.height<=0)throw new RangeError('Viewport must have positive finite width and height');
 const span=viewport.worldSpan===undefined?3.4:viewport.worldSpan;
 if(!finite(span)||span<=0)throw new RangeError('World span must be finite and positive');
 const frame=cameraFrame(camera),scale=Math.min(viewport.width,viewport.height)/span*camera.zoom;
 const dot=a=>a.reduce((sum,x,i)=>sum+x*point[i],0);
 return {x:viewport.width/2+scale*dot(frame.right),y:viewport.height/2-scale*dot(frame.up),depth:dot(frame.eye)};
}
