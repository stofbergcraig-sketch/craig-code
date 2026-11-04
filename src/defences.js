import * as THREE from 'three';
import {TOWER_TYPES} from './progression.js';
import {BUILD_LIMIT} from './config.js';

export function placementValid(world,towers,x,z,stored=false){
  if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>BUILD_LIMIT||Math.abs(z)>BUILD_LIMIT)return false;
  if(world.shops.some(s=>Math.hypot(x-s.x,z-s.z)<6))return false;
  const ground=world.heightAt?.(x,z)||0;
  if(!stored&&(world.slopeAt?.(x,z,1.6)||0)>.18)return false;
  if(world.colliders.some(b=>Math.abs(x-b.x)<b.w/2+1.7&&Math.abs(z-b.z)<b.d/2+1.7&&(b.y||0)<ground+6&&(b.y||0)+b.h>ground+.1))return false;
  return !towers.some(t=>Math.hypot(t.x-x,t.z-z)<4.5);
}
export class Defences {
  constructor(scene,world,progress,enemies,arcana,fx,audio){Object.assign(this,{scene,world,progress,enemies,arcana,fx,audio});this.items=[];this.pads=[];this.pending=null;
    const mat=new THREE.MeshBasicMaterial({color:0x93df8f,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false});this.preview=new THREE.Mesh(new THREE.RingGeometry(.92,1,64),mat);this.preview.rotation.x=-Math.PI/2;this.preview.visible=false;scene.add(this.preview);
    this.footprint=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,2,8),new THREE.MeshBasicMaterial({color:0x93df8f,transparent:true,opacity:.3,wireframe:true}));this.footprint.visible=false;scene.add(this.footprint);this.restore();
  }
  make(data){const d=TOWER_TYPES[data.type],group=new THREE.Group();group.position.set(data.x,this.world.heightAt?.(data.x,data.z)||0,data.z);const head=new THREE.Group();group.add(head);const stone=new THREE.MeshStandardMaterial({color:data.type==='bolt'?0x64503c:data.type==='frost'?0x647984:data.type==='soulforge'?0x1c1728:0x344448,roughness:.9,metalness:.3}),glow=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:1.1});
    const mesh=(g,size,p,mat=stone)=>{const m=new THREE.Mesh(g,mat);m.scale.set(...size);m.position.set(...p);group.add(m);return m;};
    mesh(new THREE.CylinderGeometry(1.4,1.6,.35,8),[1,1,1],[0,.17,0]);const height=data.type==='bolt'||data.type==='ballista'?2.2:data.type==='frost'?5.5:4;
    const body=mesh(data.type==='soulforge'?new THREE.ConeGeometry(.8,3.4,4):new THREE.CylinderGeometry(.6,.95,height,6),[1,1,1],[0,data.type==='soulforge'?3.2:height/2+.3,0]);head.position.y=height+.3;
    const enhanced=new THREE.Group();group.add(enhanced);
    for(let i=0;i<8;i++){const rune=new THREE.Mesh(new THREE.BoxGeometry(.12,.42,.12),glow);rune.position.set(Math.sin(i*Math.PI/4)*.88,1.2,Math.cos(i*Math.PI/4)*.88);enhanced.add(rune);}enhanced.visible=data.level>=2;
    const crown=new THREE.Group();group.add(crown);for(let i=0;i<5;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.2,.9,4),glow);spike.position.set(Math.sin(i*1.256)*.85,height+.3,Math.cos(i*1.256)*.85);crown.add(spike);}crown.visible=data.level===3;
    if(data.type==='bolt'||data.type==='ballista'){const arm=new THREE.Mesh(new THREE.BoxGeometry(2.5,.18,.2),stone);head.add(arm);const rail=new THREE.Mesh(new THREE.BoxGeometry(.2,.25,2.1),stone);rail.position.z=.45;head.add(rail);for(const s of [-1,1]){const bow=new THREE.Mesh(new THREE.BoxGeometry(1.3,.1,.1),glow);bow.position.set(s*.6,0,-.25);bow.rotation.y=s*.3;head.add(bow);}}
    else {const core=new THREE.Mesh(data.type==='spire'?new THREE.ConeGeometry(.65,2.5,5):new THREE.OctahedronGeometry(.65),glow);core.position.y=.55;head.add(core);const halo=new THREE.Mesh(new THREE.TorusGeometry(1,.05,5,24),glow);halo.rotation.x=Math.PI/2;head.add(halo);}
    const rings=[];
    if(data.type==='frost'){for(let i=0;i<6;i++){const ice=new THREE.Mesh(new THREE.ConeGeometry(.15,.9+(i%2)*.4,4),glow);ice.position.set(Math.sin(i*Math.PI/3)*.72,4.7,Math.cos(i*Math.PI/3)*.72);ice.rotation.z=Math.PI;group.add(ice);}for(let i=0;i<4;i++){const rune=new THREE.Mesh(new THREE.BoxGeometry(.12,.55,.08),glow);rune.position.set(0,1.4+i*.8,.8);group.add(rune);}}
    if(data.type==='soulforge'){for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.25+i*.14,.035,5,32),glow);ring.position.y=2.5+i*.65;ring.rotation.x=Math.PI/2+i*.4;group.add(ring);rings.push(ring);}for(let i=0;i<6;i++){const rune=new THREE.Mesh(new THREE.BoxGeometry(.13,.22,.09),glow);rune.position.set(0,1.8+i*.3,.58);body.add(rune);rune.position.y-=3.2;}}
    this.scene.add(group);const collider={x:data.x,z:data.z,w:2.4,d:2.4,h:1.8,y:group.position.y,tower:true};this.world.colliders.push(collider);return {data,group,head,body,rings,enhanced,crown,collider,cooldown:Math.random()*.3,pulse:4,age:Math.random()*3};
  }
  restore(){this.clearPads();this.clear();for(const t of this.progress.data.towers){const placed=this.items.map(i=>i.data);let clear=placementValid(this.world,placed,t.x,t.z,true);
    if(!clear){const x=t.x,z=t.z;for(let r=4;r<=12&&!clear;r+=2)for(let a=0;a<16&&!clear;a++){const nx=x+Math.sin(a*Math.PI/8)*r,nz=z+Math.cos(a*Math.PI/8)*r;if(placementValid(this.world,placed,nx,nz,true)){t.x=nx;t.z=nz;clear=true;}}}
    if(clear)this.items.push(this.make(t));
  }this.createPads();}
  destroy(t){this.scene.remove(t.group);t.group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});const i=this.world.colliders.indexOf(t.collider);if(i>=0)this.world.colliders.splice(i,1);}
  clearPads(){for(const p of this.pads)if(p.display)this.destroy(p.display);this.pads=[];}
  createPads(){for(const spot of this.world.purchasePads||[]){if(this.progress.data.towers.some(t=>t.padId===spot.id||Math.hypot(t.x-spot.x,t.z-spot.z)<4))continue;
    let point=null;for(let r=0;r<=8&&!point;r+=2)for(let a=0;a<(r?12:1)&&!point;a++){const x=spot.x+Math.sin(a*Math.PI/6)*r,z=spot.z+Math.cos(a*Math.PI/6)*r;if(placementValid(this.world,this.progress.data.towers,x,z))point={...spot,x,z};}
    if(!point)continue;const display=this.make({...point,level:1});const materials=new Set();display.group.traverse(o=>{if(o.material)materials.add(o.material);});for(const m of materials){m.color.multiplyScalar(.42);if(m.emissiveIntensity)m.emissiveIntensity=.12;}
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.6,1.72,32),new THREE.MeshBasicMaterial({color:0xcbac70,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;display.group.add(ring);
    if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#152721';ctx.fillRect(0,0,512,128);ctx.textAlign='center';ctx.fillStyle='#e5d7b1';ctx.font='bold 24px Georgia';ctx.fillText(TOWER_TYPES[spot.type].name,256,45);ctx.font='22px Arial';ctx.fillText('F  ·  '+TOWER_TYPES[spot.type].cost.toLocaleString()+' Shekkles',256,88);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false}));label.position.y=3;label.scale.set(4,.95,1);display.group.add(label);display.label=label;label.visible=false;}
    this.pads.push({...point,display});
  }}
  nearPurchase(position){let best=null,distance=4.8;for(const p of this.pads)if(p.display){const d=Math.hypot(p.x-position.x,p.z-position.z);if(d<distance&&Math.abs(p.display.group.position.y-position.y)<3){distance=d;best=p;}}return best;}
  purchasePad(id){const p=this.pads.find(p=>p.id===id);if(!p||!p.display||this.progress.data.towers.some(t=>t.padId===id))return {ok:false,message:'Already purchased'};
    if(this.progress.data.coins<TOWER_TYPES[p.type].cost)return {ok:false,message:'Not enough Shekkles'};
    const data=this.progress.placeTower(p.type,p.x,p.z,id);if(!data)return {ok:false,message:'Defence limit reached'};
    this.destroy(p.display);p.display=null;this.items.push(this.make(data));this.audio.play('buy');return {ok:true,message:TOWER_TYPES[p.type].name+' activated'};
  }
  clear(){for(const t of this.items){this.scene.remove(t.group);t.group.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});const i=this.world.colliders.indexOf(t.collider);if(i>=0)this.world.colliders.splice(i,1);}this.items=[];this.cancel();}
  begin(type){if(!TOWER_TYPES[type])return false;this.pending=type;this.valid=false;this.preview.visible=false;this.footprint.visible=false;return true;}
  cancel(){this.pending=null;this.valid=false;this.preview.visible=false;this.footprint.visible=false;}
  aim(player){if(!this.pending)return;const p=player.position,d=player.forward();this.x=p.x+d.x*7;this.z=p.z+d.z*7;const y=this.world.heightAt?.(this.x,this.z)||0,playerGround=this.world.heightAt?.(p.x,p.z)||0;this.valid=player.grounded&&Math.abs(p.y-playerGround)<.2&&Math.hypot(this.x-p.x,this.z-p.z)>3&&placementValid(this.world,this.progress.data.towers,this.x,this.z)&&this.progress.data.towers.length<16&&this.progress.data.coins>=TOWER_TYPES[this.pending].cost;const color=this.valid?0x91e887:0xf17662;this.preview.material.color.setHex(color);this.footprint.material.color.setHex(color);this.preview.position.set(this.x,y+.08,this.z);const range=TOWER_TYPES[this.pending].range;this.preview.scale.setScalar(range);const vertices=this.preview.geometry.attributes.position;for(let i=0;i<vertices.count;i++)vertices.setZ(i,((this.world.heightAt?.(this.x+vertices.getX(i)*range,this.z-vertices.getY(i)*range)||0)-y)/range);vertices.needsUpdate=true;this.preview.frustumCulled=false;this.footprint.position.set(this.x,y+1,this.z);this.preview.visible=this.footprint.visible=true;}
  place(){if(!this.pending||!this.valid||!placementValid(this.world,this.progress.data.towers,this.x,this.z))return false;const data=this.progress.placeTower(this.pending,this.x,this.z);if(!data)return false;this.items.push(this.make(data));this.cancel();this.audio.play('trap');return true;}
  nearest(position){return this.items.find(t=>Math.hypot(t.data.x-position.x,t.data.z-position.z)<4.5);}
  update(dt){for(const p of this.pads)if(p.display?.label)p.display.label.visible=Math.hypot((this.scene.userData.playerX||0)-p.x,(this.scene.userData.playerZ||0)-p.z)<16;for(const t of this.items){const d=TOWER_TYPES[t.data.type],rank=t.data.level; t.age+=dt;t.pulse-=dt;t.enhanced.visible=rank>=2;t.crown.visible=rank>=3;
    if(t.data.type==='soulforge'){t.body.position.y=3.2+Math.sin(t.age*1.7)*.22;t.body.rotation.y=t.age*.12;t.rings.forEach((r,i)=>{r.rotation.z+=dt*(i%2?-1:1)*.6;r.scale.setScalar(rank===3?1.28:1);});}
    if(t.data.type==='frost')t.head.rotation.y+=dt*.35;
    const origin=t.head.getWorldPosition(new THREE.Vector3());origin.y+=.4;
    if(t.pulse<=0&&(t.data.type==='frost'||t.data.type==='soulforge')){
      t.pulse=t.data.type==='frost'?7:8;const radius=t.data.type==='frost'?(rank===3?18:rank===2?12:9):(rank===3?19:11);const p=t.group.position;
      if(t.data.type==='frost'){this.enemies.slowArea(p,radius,rank===3?4.5:3,rank===1?.55:rank===2?.42:.32);this.audio.play('frost',.35);}
      else {this.enemies.blast(p,radius,rank===3?350:125,18);this.audio.play('soulforge',.4);}
      this.fx.ring(p,radius,t.data.type==='frost'?0x9ce6ee:0xa52d55);
    }
    t.cooldown-=dt;if(t.cooldown>0)continue;
    const target=this.arcana.target(origin,d.range*(1+(rank-1)*.15));if(!target){t.cooldown=.2;continue;}const point=target.position.clone().add(new THREE.Vector3(0,.9,0));
    if(t.data.type==='bolt'||t.data.type==='ballista'){const speed=t.data.type==='ballista'?55:36,delta=point.clone().sub(origin),a=target.velocity.lengthSq()-speed*speed,b=2*delta.dot(target.velocity),c=delta.lengthSq(),disc=b*b-4*a*c;const flight=disc>=0&&Math.abs(a)>.001?(-b-Math.sqrt(disc))/(2*a):Math.sqrt(c)/speed;if(flight>0)point.addScaledVector(target.velocity,Math.min(1.5,flight));}
    const dir=point.clone().sub(origin).normalize();t.head.rotation.y=Math.atan2(dir.x,dir.z);t.cooldown=d.cooldown/(1+(rank-1)*.35);const damage=d.damage*(rank===3?1.8:rank===2?1.2:1);
    if(t.data.type==='frost'){this.arcana.fire(origin,dir,{kind:'orb',target,speed:rank===1?30:44,damage,force:2,color:d.color,onHit:e=>this.enemies.slow(e,rank===3?4.5:3,rank===1?.55:rank===2?.42:.32)});this.audio.play('frost',.3);}
    else if(t.data.type==='soulforge'){const hit=new Set();let e=target;for(let i=0;i<(rank===1?2:rank===2?4:6)&&e;i++){hit.add(e.id);const point=e.position.clone().add(new THREE.Vector3(0,.8,0));this.fx.tracer(origin,point,d.color);this.enemies._damage(e,damage,dir,8);e=this.arcana.target(origin,d.range*(1+(rank-1)*.15),null,-1,hit);}this.audio.play('soulforge',.3);}
    else if(t.data.type==='storm'){let prev=origin;const hit=new Set();let e=target;for(let j=0;j<8&&e;j++){hit.add(e.id);const dest=e.position.clone().add(new THREE.Vector3(0,.9,0));this.enemies._damage(e,damage,dir,10);this.fx.tracer(prev,dest,d.color);prev=dest;e=this.arcana.target(dest,8,null,-1,hit);}this.audio.play('lightning',.35);}
    else {this.arcana.fire(origin,dir,{kind:t.data.type==='bolt'||t.data.type==='ballista'?'bolt':'orb',target:t.data.type==='wizard'||t.data.type==='spire'?target:null,speed:t.data.type==='ballista'?55:36,damage,force:20,pierce:t.data.type==='ballista'?6:1,blast:t.data.type==='spire'?10:t.data.type==='wizard'?3:0,color:d.color,size:t.data.type==='spire'?2:1});this.audio.play(t.data.type==='bolt'||t.data.type==='ballista'?'bolt':'magic',.3);}
  }}
}
