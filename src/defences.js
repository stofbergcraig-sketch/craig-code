import * as THREE from 'three';
import {TOWER_TYPES} from './progression.js';

export function placementValid(world,towers,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>98||Math.abs(z)>98)return false;
  if(world.shops.some(s=>Math.hypot(x-s.x,z-s.z)<6))return false;
  if(world.colliders.some(b=>Math.abs(x-b.x)<b.w/2+1.7&&Math.abs(z-b.z)<b.d/2+1.7&&(b.y||0)<6))return false;
  return !towers.some(t=>Math.hypot(t.x-x,t.z-z)<4.5);
}
export class Defences {
  constructor(scene,world,progress,enemies,arcana,fx,audio){Object.assign(this,{scene,world,progress,enemies,arcana,fx,audio});this.items=[];this.pending=null;
    const mat=new THREE.MeshBasicMaterial({color:0x93df8f,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false});this.preview=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),mat);this.preview.rotation.x=-Math.PI/2;this.preview.visible=false;scene.add(this.preview);
    this.footprint=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,2,8),new THREE.MeshBasicMaterial({color:0x93df8f,transparent:true,opacity:.3,wireframe:true}));this.footprint.visible=false;scene.add(this.footprint);this.restore();
  }
  make(data){const d=TOWER_TYPES[data.type],group=new THREE.Group();group.position.set(data.x,0,data.z);const head=new THREE.Group();group.add(head);const stone=new THREE.MeshStandardMaterial({color:data.type==='bolt'?0x64503c:0x344448,roughness:.9,metalness:.3}),glow=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:1.1});
    const mesh=(g,size,p,mat=stone)=>{const m=new THREE.Mesh(g,mat);m.scale.set(...size);m.position.set(...p);group.add(m);return m;};
    mesh(new THREE.CylinderGeometry(1.4,1.6,.35,8),[1,1,1],[0,.17,0]);const height=data.type==='bolt'||data.type==='ballista'?2.2:4;
    mesh(new THREE.CylinderGeometry(.6,.95,height,6),[1,1,1],[0,height/2+.3,0]);head.position.y=height+.3;
    const enhanced=new THREE.Group();group.add(enhanced);
    for(let i=0;i<8;i++){const rune=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.12),glow);rune.position.set(Math.sin(i*Math.PI/4)*.88,1.2,Math.cos(i*Math.PI/4)*.88);enhanced.add(rune);}enhanced.visible=data.level>=2;
    const crown=new THREE.Group();group.add(crown);for(let i=0;i<5;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.2,.9,4),glow);spike.position.set(Math.sin(i*1.256)*.85,height+.3,Math.cos(i*1.256)*.85);crown.add(spike);}crown.visible=data.level===3;
    if(data.type==='bolt'||data.type==='ballista'){const arm=new THREE.Mesh(new THREE.BoxGeometry(2.5,.18,.2),stone);head.add(arm);const rail=new THREE.Mesh(new THREE.BoxGeometry(.2,.25,2.1),stone);rail.position.z=.45;head.add(rail);for(const s of [-1,1]){const bow=new THREE.Mesh(new THREE.BoxGeometry(1.3,.1,.1),glow);bow.position.set(s*.6,0,-.25);bow.rotation.y=s*.3;head.add(bow);}}
    else {const core=new THREE.Mesh(data.type==='spire'?new THREE.ConeGeometry(.65,2.5,5):new THREE.OctahedronGeometry(.65),glow);core.position.y=.55;head.add(core);const halo=new THREE.Mesh(new THREE.TorusGeometry(1,.05,5,24),glow);halo.rotation.x=Math.PI/2;head.add(halo);}
    this.scene.add(group);const collider={x:data.x,z:data.z,w:2.4,d:2.4,h:1.8,tower:true};this.world.colliders.push(collider);return {data,group,head,enhanced,crown,collider,cooldown:Math.random()*.3};
  }
  restore(){this.clear();for(const t of this.progress.data.towers){if(placementValid(this.world,this.items.map(i=>i.data),t.x,t.z))this.items.push(this.make(t));}this.progress.data.towers=this.items.map(t=>t.data);}
  clear(){for(const t of this.items){this.scene.remove(t.group);t.group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});const i=this.world.colliders.indexOf(t.collider);if(i>=0)this.world.colliders.splice(i,1);}this.items=[];this.cancel();}
  begin(type){if(!TOWER_TYPES[type])return false;this.pending=type;return true;}
  cancel(){this.pending=null;this.preview.visible=false;this.footprint.visible=false;}
  aim(player){if(!this.pending)return;const p=player.position,d=player.forward();this.x=p.x+d.x*7;this.z=p.z+d.z*7;this.valid=player.grounded&&p.y<.2&&Math.hypot(this.x-p.x,this.z-p.z)>3&&placementValid(this.world,this.progress.data.towers,this.x,this.z)&&this.progress.data.towers.length<16&&this.progress.data.coins>=TOWER_TYPES[this.pending].cost;const color=this.valid?0x91e887:0xf17662;this.preview.material.color.setHex(color);this.footprint.material.color.setHex(color);this.preview.position.set(this.x,.08,this.z);this.preview.scale.setScalar(TOWER_TYPES[this.pending].range);this.footprint.position.set(this.x,1,this.z);this.preview.visible=this.footprint.visible=true;}
  place(){if(!this.pending||!this.valid||!placementValid(this.world,this.progress.data.towers,this.x,this.z))return false;const data=this.progress.placeTower(this.pending,this.x,this.z);if(!data)return false;this.items.push(this.make(data));this.cancel();this.audio.play('trap');return true;}
  nearest(position){return this.items.find(t=>Math.hypot(t.data.x-position.x,t.data.z-position.z)<4.5);}
  update(dt){for(const t of this.items){const d=TOWER_TYPES[t.data.type],rank=t.data.level,origin=t.head.getWorldPosition(new THREE.Vector3());origin.y+=.4;t.enhanced.visible=rank>=2;t.crown.visible=rank>=3;t.cooldown-=dt;if(t.cooldown>0)continue;
    const target=this.arcana.target(origin,d.range*(1+(rank-1)*.15));if(!target){t.cooldown=.2;continue;}const point=target.position.clone().add(new THREE.Vector3(0,.9,0)),dir=point.clone().sub(origin).normalize();t.head.rotation.y=Math.atan2(dir.x,dir.z);t.cooldown=d.cooldown/(1+(rank-1)*.35);const damage=d.damage*(rank===3?1.8:rank===2?1.2:1);
    if(t.data.type==='storm'){let prev=origin;const hit=new Set();let e=target;for(let j=0;j<8&&e;j++){hit.add(e.id);const dest=e.position.clone().add(new THREE.Vector3(0,.9,0));this.enemies._damage(e,damage,dir,10);this.fx.tracer(prev,dest,d.color);prev=dest;e=this.arcana.target(dest,8,null,-1,hit);}this.audio.play('lightning',.35);}
    else {this.arcana.fire(origin,dir,{kind:t.data.type==='bolt'||t.data.type==='ballista'?'bolt':'orb',target:t.data.type==='wizard'||t.data.type==='spire'?target:null,speed:t.data.type==='ballista'?55:36,damage,force:20,pierce:t.data.type==='ballista'?6:1,blast:t.data.type==='spire'?10:t.data.type==='wizard'?3:0,color:d.color,size:t.data.type==='spire'?2:1});this.audio.play(t.data.type==='bolt'||t.data.type==='ballista'?'bolt':'magic',.3);}
  }}
}
