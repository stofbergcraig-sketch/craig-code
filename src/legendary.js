import * as THREE from 'three';
import {buildLegendarySword} from './weapons.js';
import {EXCALIBUR_KILLS} from './progression.js';
import {OATH_SUMMIT,OATH_BASE,OATH_ROUTE} from './oath-route.js';

export class LegendarySite {
  constructor(scene,world,progress,fx,audio){Object.assign(this,{scene,world,progress,fx,audio});this.center=new THREE.Vector3(OATH_SUMMIT.x,0,OATH_SUMMIT.z);this.elapsed=-1;
    const stone=new THREE.MeshStandardMaterial({color:0x4b6156,roughness:1,flatShading:true}),soil=new THREE.MeshStandardMaterial({color:0x344c3e,roughness:1,flatShading:true});
    const x=OATH_SUMMIT.x,z=OATH_SUMMIT.z;this.top=world.heightAt?.(x,z)??OATH_SUMMIT.y;this.center.y=this.top;this.route=OATH_ROUTE;this.base=OATH_BASE;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(1.4,0),stone);rock.scale.set(1.4,.8,1);rock.position.set(x,this.top+.7,z);scene.add(rock);world.colliders.push({x,z,w:2.4,d:2,h:1.7,y:this.top,legendary:true});
    this.sword=buildLegendarySword().group;this.sword.rotation.set(0,0,Math.PI);this.sword.position.set(x,this.top+2.2,z);this.sword.scale.setScalar(2);scene.add(this.sword);
    const glow=new THREE.MeshBasicMaterial({color:0xc6e9a6,transparent:true,opacity:.6,depthWrite:false});this.runes=new THREE.Group();this.runes.position.set(x,this.top+.05,z);scene.add(this.runes);
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.25,2.35,40),glow);ring.rotation.x=-Math.PI/2;this.runes.add(ring);for(let i=0;i<12;i++){const rune=new THREE.Mesh(new THREE.BoxGeometry(.12,.03,.45),glow);rune.position.set(Math.sin(i*Math.PI/6)*2.1,.03,Math.cos(i*Math.PI/6)*2.1);rune.rotation.y=i*Math.PI/6+.5;this.runes.add(rune);}
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.15,25,6,1,true),new THREE.MeshBasicMaterial({color:0xc8eab4,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));beam.position.set(x,this.top+12,z);scene.add(beam);this.beam=beam;
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#162825';c.fillRect(0,0,512,128);c.fillStyle='#e2d6ac';c.font='bold 40px Georgia';c.textAlign='center';c.fillText('OATH HILL',256,56);c.font='21px Arial';c.fillText('EXCALIBUR · 20,000 SOULS',256,96);const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas)}));sign.position.set(x,this.top+5,z);sign.scale.set(7,1.75,1);scene.add(sign);
  }
  near(player){return player.position.distanceTo(this.center)<4.5;}
  prompt(){return this.progress.data.owned.includes('excalibur')?'EXCALIBUR CLAIMED':this.progress.data.kills<EXCALIBUR_KILLS?`EXCALIBUR — 20,000 GOBLIN SOULS REQUIRED · ${this.progress.data.kills.toLocaleString()} / 20,000`:'PULL EXCALIBUR FROM THE STONE';}
  interact(){if(this.progress.data.owned.includes('excalibur')||this.elapsed>=0)return false;if(this.progress.data.kills<EXCALIBUR_KILLS)return false;this.elapsed=0;this.audio.play('charge');return true;}
  update(dt,time,camera){const owned=this.progress.data.owned.includes('excalibur');this.sword.visible=!owned;this.beam.visible=!owned;this.runes.rotation.y=time*.06;this.runes.children[0].material.opacity=.35+Math.sin(time*2)*.1;
    if(this.elapsed<0||owned)return false;this.elapsed+=dt;const focus=this.center.clone().add(new THREE.Vector3(0,2.3,0));camera.lookAt(focus);this.sword.position.y=this.top+2.2+Math.min(1,this.elapsed/.85)*2;
    if(this.elapsed>=.85){this.elapsed=-1;this.progress.unlockExcalibur();this.fx.ring(this.center.clone().setY(this.top),18,0xe2e9b2);this.fx.burst(focus,0xffe5a5,4);this.audio.play('legendary');return true;}return false;
  }
  reset(){this.elapsed=-1;this.sword.position.y=this.top+2.2;}
}
