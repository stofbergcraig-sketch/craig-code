import * as THREE from 'three';

export class Player {
  constructor(camera, world, cue = () => {}) {
    this.camera=camera; this.world=world; this.cue=cue;
    this.position=new THREE.Vector3(0,0,12); this.velocity=new THREE.Vector3();
    this.yaw=0;this.pitch=0;this.health=100;this.grounded=true;this.jumps=0;
    this.dashCooldown=0;this.dashTime=0;this.slideTime=0;this.slam=false;this.step=0;this.damageCooldown=0;
  }
  look(x,y,sensitivity=1) { this.yaw-=x*.0018*sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-y*.0018*sensitivity,-1.48,1.48); }
  forward() { return new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(this.pitch,this.yaw,0,'YXZ')); }
  jump() { if(this.jumps>=2)return;this.velocity.y=this.jumps===0?9:8.8;this.jumps++;this.grounded=false;this.slam=false;this.cue('jump'); }
  dash(keys) {
    if(this.dashCooldown>0)return;
    let v=this.direction(keys);if(v.lengthSq()<.01)v.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
    this.velocity.x=v.x*34;this.velocity.z=v.z*34;this.dashTime=.2;this.dashCooldown=.85;this.cue('dash');
  }
  slide() { if(!this.grounded){this.slam=true;this.velocity.y=-32;this.cue('dash');return;}
    this.slideTime=.75;let v=new THREE.Vector3(this.velocity.x,0,this.velocity.z);if(v.length()<3)v.set(-Math.sin(this.yaw),0,-Math.cos(this.yaw));v.normalize().multiplyScalar(24);this.velocity.x=v.x;this.velocity.z=v.z;this.cue('slide'); }
  direction(keys) { return new THREE.Vector3((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),0,(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)).normalize().applyAxisAngle(new THREE.Vector3(0,1,0),this.yaw); }
  respawn() {this.position.set(0,0,12);this.velocity.set(0,0,0);this.health=100;this.jumps=0;this.grounded=true;this.slam=false;this.yaw=0;this.pitch=0;this.damageCooldown=2;}
  update(dt,keys) {
    this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.dashTime=Math.max(0,this.dashTime-dt);this.slideTime=Math.max(0,this.slideTime-dt);this.damageCooldown=Math.max(0,this.damageCooldown-dt);
    const dir=this.direction(keys), sprint=keys.has('ShiftLeft')||keys.has('ShiftRight');
    if(this.dashTime<=0){
      const sliding=this.slideTime>0, speed=sliding?21:sprint?15:10.5;
      const blend=1-Math.exp(-(this.grounded?(sliding?2:18):5)*dt);
      if(!sliding||dir.lengthSq()>0){ this.velocity.x=THREE.MathUtils.lerp(this.velocity.x,dir.x*speed,blend);this.velocity.z=THREE.MathUtils.lerp(this.velocity.z,dir.z*speed,blend); }
      else {this.velocity.x*=Math.exp(-dt*1.3);this.velocity.z*=Math.exp(-dt*1.3);}
    }
    const oldY=this.position.y;this.velocity.y-=25*dt;
    const radius=.38, height=this.slideTime>0?1.05:1.72;
    // Resolve axes separately, allowing a small automatic step onto low stonework.
    for(const axis of ['x','z']) {
      this.position[axis]+=this.velocity[axis]*dt;
      for(const b of this.world.colliders){
        const bottom=b.y||0,top=bottom+b.h;
        if(this.position.y>=top-.02||this.position.y+height<=bottom+.02)continue;
        if(Math.abs(this.position.x-b.x)<b.w/2+radius&&Math.abs(this.position.z-b.z)<b.d/2+radius){
          if(top-this.position.y<=.5&&this.grounded){this.position.y=top;continue;}
          const half=(axis==='x'?b.w:b.d)/2;
          this.position[axis]=b[axis]+(this.position[axis]>b[axis]?1:-1)*(half+radius+.001);this.velocity[axis]=0;
        }
      }
    }
    this.position.y+=this.velocity.y*dt;let floor=0;
    for(const b of this.world.colliders){const top=(b.y||0)+b.h;
      if(Math.abs(this.position.x-b.x)<b.w/2+radius*.6&&Math.abs(this.position.z-b.z)<b.d/2+radius*.6){
        if(oldY>=top-.05&&this.position.y<=top&&this.velocity.y<=0)floor=Math.max(floor,top);
        if(oldY+height<=(b.y||0)&&this.position.y+height>(b.y||0)&&this.velocity.y>0){this.position.y=(b.y||0)-height;this.velocity.y=0;}
      }
    }
    if(this.position.y<=floor){const landed=!this.grounded;this.position.y=floor;this.velocity.y=0;this.grounded=true;this.jumps=0;if(landed&&this.slam)this.cue('slam');this.slam=false;}
    else {this.grounded=false;if(this.jumps===0)this.jumps=1;}
    this.position.x=THREE.MathUtils.clamp(this.position.x,-105,105);this.position.z=THREE.MathUtils.clamp(this.position.z,-105,105);
    this.step+=Math.hypot(this.velocity.x,this.velocity.z)*dt;
    const eye=this.slideTime>0?1:1.7;
    this.eyeHeight=THREE.MathUtils.lerp(this.eyeHeight||1.7,eye,1-Math.exp(-dt*18));
    this.camera.position.copy(this.position).add(new THREE.Vector3(0,this.eyeHeight,0));
    this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    const targetFov=this.dashTime>0?88:sprint&&dir.lengthSq()>0?82:76;
    this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,targetFov,1-Math.exp(-dt*6));this.camera.updateProjectionMatrix();
  }
}
