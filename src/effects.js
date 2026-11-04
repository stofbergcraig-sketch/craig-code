import * as THREE from 'three';
export class Effects {
  constructor(scene,world={}) {
    this.scene=scene;this.world=world;this.items=[];this.rings=[];this.cracks=[];this.max=700;this.dummy=new THREE.Object3D();
    this.mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.085,.085,.085),new THREE.MeshBasicMaterial(),this.max);this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.mesh.frustumCulled=false;scene.add(this.mesh);this.mesh.count=0;
  }
  burst(position,color=0xb5e74c,intensity=1) {
    const n=Math.min(32,Math.ceil(7*intensity));
    for(let i=0;i<n&&this.items.length<this.max;i++)this.items.push({p:position.clone(),v:new THREE.Vector3((Math.random()-.5)*8,Math.random()*7+1,(Math.random()-.5)*8),life:.3+Math.random()*.45,max:.75,c:new THREE.Color(color),s:.5+Math.random()*1.5});
  }
  ring(position,radius,color=0xffb84f){
    if(this.rings.length>12)return;
    const mesh=new THREE.Mesh(new THREE.RingGeometry(.85,1,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.copy(position);mesh.position.y+=.08;mesh.frustumCulled=false;this.scene.add(mesh);this.rings.push({mesh,radius,t:0,conform:!!this.world.heightAt&&position.y-this.world.heightAt(position.x,position.z)<.5});
  }
  tracer(a,b,color=0xffe4a0){const direction=b.clone().sub(a);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,direction.length(),5),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8}));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());this.scene.add(mesh);this.rings.push({mesh,radius:0,t:.25});}
  crack(position,radius=4){
    if(this.cracks.length>=8)this.removeCrack(this.cracks.shift());
    const vertices=[];
    const point=(x,z)=>[x,(this.world.heightAt?.(x,z)||0)+.075,z];
    for(let branch=0;branch<9;branch++){const angle=branch*Math.PI*2/9+Math.random()*.25;let x=position.x,z=position.z;
      for(let step=0;step<5;step++){const heading=angle+(Math.random()-.5)*.55,length=radius/5*(.8+Math.random()*.3),nx=x+Math.sin(heading)*length,nz=z+Math.cos(heading)*length,width=.055*(1-step/6),px=Math.cos(heading)*width,pz=-Math.sin(heading)*width;
        const a=point(x+px,z+pz),b=point(x-px,z-pz),c=point(nx+px,nz+pz),d=point(nx-px,nz-pz);vertices.push(...a,...b,...c,...b,...d,...c);x=nx;z=nz;
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:0x190f15,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false}));mesh.renderOrder=1;this.scene.add(mesh);this.cracks.push({mesh,age:0,life:1.8});
  }
  removeCrack(crack){this.scene.remove(crack.mesh);crack.mesh.geometry.dispose();crack.mesh.material.dispose();}
  update(dt){
    for(let i=this.cracks.length-1;i>=0;i--){const c=this.cracks[i];c.age+=dt;if(c.age>=c.life){this.removeCrack(c);this.cracks.splice(i,1);}else c.mesh.material.opacity=Math.min(1,c.age/.05)*Math.min(1,(c.life-c.age)/.55)*.95;}
    for(let i=this.items.length-1;i>=0;i--){let a=this.items[i];a.life-=dt;if(a.life<=0){this.items[i]=this.items.at(-1);this.items.pop();continue;}a.v.y-=16*dt;a.p.addScaledVector(a.v,dt);const floor=(this.world.heightAt?.(a.p.x,a.p.z)||0)+.06;if(a.p.y<floor){a.p.y=floor;a.v.y=Math.abs(a.v.y)*.25;a.v.x*=.8;a.v.z*=.8;}}
    this.items.forEach((a,i)=>{this.dummy.position.copy(a.p);this.dummy.rotation.set(a.life*6,a.life*9,0);this.dummy.scale.setScalar(a.s*Math.min(1,a.life*4));this.dummy.updateMatrix();this.mesh.setMatrixAt(i,this.dummy.matrix);this.mesh.setColorAt(i,a.c);});this.mesh.count=this.items.length;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;
    for(let i=this.rings.length-1;i>=0;i--){const r=this.rings[i];r.t+=dt;if(r.t>=.36){this.scene.remove(r.mesh);r.mesh.geometry.dispose();r.mesh.material.dispose();this.rings.splice(i,1);continue;}if(r.radius){const scale=r.radius*(.15+r.t/.36*.85);r.mesh.scale.setScalar(scale);if(r.conform){const vertices=r.mesh.geometry.attributes.position;for(let j=0;j<vertices.count;j++)vertices.setZ(j,(this.world.heightAt(r.mesh.position.x+vertices.getX(j)*scale,r.mesh.position.z-vertices.getY(j)*scale)+.08-r.mesh.position.y)/scale);vertices.needsUpdate=true;}}r.mesh.material.opacity=(1-r.t/.36)*.7;}
  }
}
