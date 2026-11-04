// The trail begins at the old Oath Hill site and winds into the new southern land.
export const OATH_BASE=Object.freeze({x:18,z:60});
export const OATH_MOUNTAIN=Object.freeze({x:65,z:108,radius:42});
const route=[];
const angle=-2.2,radius=40,sx=65+Math.cos(angle)*radius,sz=108+Math.sin(angle)*radius;
for(let i=0;i<=28;i++){const t=i/28;route.push({x:18+(sx-18)*t,z:60+(sz-60)*t,y:1.2+t*.8});}
for(let i=1;i<=640;i++){const t=i/640,a=angle+t*Math.PI*4.2,r=40-36.8*t;route.push({x:65+Math.cos(a)*r,z:108+Math.sin(a)*r,y:2+29.2*t});}
export const OATH_ROUTE=Object.freeze(route.map(Object.freeze));
export const OATH_SUMMIT=OATH_ROUTE.at(-1);
export const OATH_ROUTE_LENGTH=route.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-route[i-1].x,p.y-route[i-1].y,p.z-route[i-1].z):0,0);
export function nearestOathTrail(x,z){
  let best=Infinity,index=0;
  for(let i=0;i<route.length;i++){const dx=x-route[i].x,dz=z-route[i].z,d=dx*dx+dz*dz;if(d<best){best=d;index=i;}}
  return {distance:Math.sqrt(best),point:route[index],index};
}
export function isOathTrail(x,z,margin=3.5){if(x<12||x>110||z<54||z>152)return false;return nearestOathTrail(x,z).distance<margin;}
