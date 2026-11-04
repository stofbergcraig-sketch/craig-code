// One sampled heightfield is shared by rendering, movement, AI and projectiles.
// Triangle interpolation matches Three.js PlaneGeometry's diagonal exactly.
export const TERRAIN_SIZE=224, TERRAIN_CELLS=128;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
const mound=(x,z,cx,cz,h,rx,rz)=>h*Math.exp(-(((x-cx)/rx)**2+((z-cz)/rz)**2));
export function landscapeHeight(x,z){
  let h=mound(x,z,-86,20,4.7,24,30)+mound(x,z,-56,-64,5.3,28,22)+mound(x,z,67,71,6.5,33,28)+mound(x,z,91,-47,7,30,30)+mound(x,z,0,-46,2,24,28)-mound(x,z,-46,53,2.7,27,23)-mound(x,z,38,-35,1.8,18,15);
  h+=.32*Math.sin(x*.065)*Math.cos(z*.07)+.14*Math.sin(x*.13+z*.1);
  // Existing districts keep level foundations and broad, smooth approach slopes.
  const pads=[[58,14,28,29,17,3],[0,-79,27,24,20,5],[-59,-5,19,25,15,-1.6],[-78,-40,10,8,13,-.6],[18,60,15,15,15,1.2],[0,85,8,5,14,1.2],[0,7,25,28,13,0]];
  for(const [cx,cz,rx,rz,blend,level] of pads){const outside=Math.max(Math.abs(x-cx)-rx,Math.abs(z-cz)-rz,0);h+=(level-h)*(1-smooth(outside/blend));}
  return h;
}
export function createHeightfield(){
  const cells=TERRAIN_CELLS,size=TERRAIN_SIZE,half=size/2,step=size/cells,data=new Float32Array((cells+1)**2);
  for(let z=0;z<=cells;z++)for(let x=0;x<=cells;x++)data[z*(cells+1)+x]=landscapeHeight(x*step-half,z*step-half);
  function heightAt(x,z){const gx=clamp((x+half)/step,0,cells-.000001),gz=clamp((z+half)/step,0,cells-.000001),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz,index=iz*(cells+1)+ix;
    const a=data[index],b=data[index+1],c=data[index+cells+1],d=data[index+cells+2];
    return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
  }
  function slopeAt(x,z,r=1){const h=heightAt(x,z);return Math.max(Math.abs(heightAt(x+r,z)-h),Math.abs(heightAt(x-r,z)-h),Math.abs(heightAt(x,z+r)-h),Math.abs(heightAt(x,z-r)-h))/r;}
  function rayDistance(origin,direction,maximum){
    // Bounded half-metre ray march, interpolating the first ground crossing.
    const count=Math.max(1,Math.ceil(maximum/.6));let previous=origin.y-heightAt(origin.x,origin.z),old=0;
    for(let i=1;i<=count;i++){const distance=maximum*i/count,x=origin.x+direction.x*distance,z=origin.z+direction.z*distance,difference=origin.y+direction.y*distance-heightAt(x,z);
      if(difference<=0)return old+(distance-old)*clamp(previous/(previous-difference||1),0,1);previous=difference;old=distance;
    }return maximum;
  }
  return {cells,size,step,data,heightAt,slopeAt,rayDistance};
}
