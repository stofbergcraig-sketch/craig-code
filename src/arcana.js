import * as THREE from 'three';

// One bounded pool handles player magic, tower bolts and homing orbs.
export class Arcana {
  constructor(scene,enemies,fx,audio){
    Object.assign(this,{scene,enemies,fx,audio});this.pool=[];this.serial=0;this.delta=new THREE.Vector3();
    this.geometry=new THREE.TorusGeometry(.19,.045,4,12);
    this.boltGeometry=new THREE.CylinderGeometry(.045,.045,1,4);this.boltGeometry.rotateX(Math.PI/2);this.orbGeometry=new THREE.IcosahedronGeometry(.22,1);
    for(let i=0;i<96;i++){const material=new THREE.MeshBasicMaterial({color:0xb7eab1});const mesh=new THREE.Mesh(this.geometry,material);mesh.visible=false;scene.add(mesh);this.pool.push({mesh,active:false,position:new THREE.Vector3(),direction:new THREE.Vector3(),hit:new Set()});}
  }
  target(origin,range,direction=null,cos=-1,exclude=null){
    let best=null,score=Infinity;
    for(const e of this.enemies.enemies){if(!e.active||exclude?.has(e.id))continue;const delta=this.delta.copy(e.position);delta.y+=.9;delta.sub(origin);const d=delta.length();if(d>range||d<.01)continue;delta.divideScalar(d);if(direction&&delta.dot(direction)<cos)continue;const value=direction?d*(1.5-delta.dot(direction)):d;if(value>=score||this.enemies._wallDistance(origin,delta,d)<d-.3)continue;best=e;score=value;}
    return best;
  }
  fire(origin,direction,options={}){
    const p=this.pool.find(p=>!p.active);if(!p)return false;
    Object.assign(p,{active:true,life:2,damage:125,force:12,speed:42,pierce:1,bounce:0,blast:0,target:null,onHit:null,hookOrigin:null,retract:false,trailTimer:0,kind:'disc',...options});p.position.copy(origin);p.direction.copy(direction).normalize();p.hit.clear();p.mesh.visible=true;p.mesh.geometry=p.kind==='bolt'?this.boltGeometry:p.kind==='orb'?this.orbGeometry:this.geometry;p.mesh.material.color.setHex(options.color??0xb8df96);p.mesh.scale.setScalar(options.size??1);p.mesh.position.copy(origin);return true;
  }
  update(dt){for(const p of this.pool){if(!p.active)continue;p.life-=dt;if(p.life<=0){this.expire(p);continue;}
    if(p.hookOrigin){p.trailTimer-=dt;if(p.trailTimer<=0){this.fx.tracer(p.hookOrigin,p.position,0x88a89b);p.trailTimer=.045;}}
    if(p.retract){this.delta.copy(p.hookOrigin).sub(p.position);const distance=this.delta.length();if(distance<.6){this.expire(p);continue;}p.position.addScaledVector(this.delta.normalize(),Math.min(distance,60*dt));p.mesh.position.copy(p.position);continue;}
    if(p.target?.active){const desired=p.target.position.clone().add(new THREE.Vector3(0,.85,0)).sub(p.position).normalize();p.direction.lerp(desired,Math.min(1,dt*7)).normalize();}
    const distance=p.speed*dt,wall=this.enemies._wallDistance(p.position,p.direction,distance);let first=null,along=wall;
    for(const e of this.enemies.enemies){if(!e.active||p.hit.has(e.id))continue;const d=this.delta.copy(e.position);d.y+=.85;d.sub(p.position);const projection=d.dot(p.direction);if(projection>=-.4&&projection<=along+.3&&d.lengthSq()-projection*projection<.75){first=e;along=Math.max(0,projection);}}
    if(first){p.position.addScaledVector(p.direction,along);p.hit.add(first.id);this.enemies._damage(first,p.damage,p.direction,p.force);p.onHit?.(first);if(first.active)this.fx.burst(p.position,p.mesh.material.color.getHex(),.7);
      if(p.blast)this.enemies.blast(p.position,p.blast,p.damage,p.force);
      if(p.bounce>0){p.bounce--;p.target=this.target(p.position,10,null,-1,p.hit);if(p.target){p.direction.copy(p.target.position).add(new THREE.Vector3(0,.85,0)).sub(p.position).normalize();continue;}}
      if(p.hookOrigin){p.retract=true;p.life=.7;p.target=null;continue;}
      p.pierce--;if(p.pierce<=0){this.expire(p);continue;}p.position.addScaledVector(p.direction,.8);
    }else if(wall<distance){this.fx.burst(p.position,p.mesh.material.color.getHex(),.4);this.expire(p);continue;}
    else p.position.addScaledVector(p.direction,distance);
    p.mesh.position.copy(p.position);if(p.kind==='bolt')p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),p.direction);else{p.mesh.rotation.x+=dt*16;p.mesh.rotation.z+=dt*20;}
  }}
  expire(p){p.active=false;p.mesh.visible=false;p.target=null;}
  clear(){for(const p of this.pool)this.expire(p);}
}
