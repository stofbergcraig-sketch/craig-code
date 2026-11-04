import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHeightfield} from '../src/terrain.js';
import {Player} from '../src/player.js';
import {EnemySystem} from '../src/enemies.js';
import {Defences,placementValid} from '../src/defences.js';
import {Progression} from '../src/progression.js';
import {Arcana} from '../src/arcana.js';
const terrain=createHeightfield(),makeWorld=()=>({colliders:[],shops:[],spawnPoints:[],heightAt:terrain.heightAt,slopeAt:terrain.slopeAt,groundRayDistance:terrain.rayDistance});
const fx={burst(){},tracer(){},ring(){}},audio={play(){}};
test('terrain has valleys, ridges and preserved flat district foundations; samples match vertex heights',()=>{
 let min=99,max=-99,slope=0;for(let z=-100;z<=100;z+=2)for(let x=-100;x<=100;x+=2){const h=terrain.heightAt(x,z);min=Math.min(min,h);max=Math.max(max,h);if(Math.hypot(x-65,z-108)>48)slope=Math.max(slope,terrain.slopeAt(x,z));}
 assert.ok(min<-2);assert.ok(max>6);assert.ok(slope<.7);assert.equal(terrain.heightAt(0,12),0);assert.equal(terrain.heightAt(58,14),3);assert.equal(terrain.heightAt(0,-79),5);assert.ok(terrain.heightAt(-59,-5)<-1.5);
 for(let z=1;z<terrain.cells;z+=7)for(let x=1;x<terrain.cells;x+=7)assert.ok(Math.abs(terrain.heightAt(x*terrain.step-terrain.size/2,z*terrain.step-terrain.size/2)-terrain.data[z*(terrain.cells+1)+x])<1e-5);
});
test('sprinting, dash, slide, jumping and landing remain grounded across slopes and dips',()=>{
 const world=makeWorld(),p=new Player(new THREE.PerspectiveCamera(),world);p.position.set(25,world.heightAt(25,9),9);let high=-99,low=99;
 for(let i=0;i<500;i++){p.update(.008,new Set(['KeyD','ShiftLeft']));high=Math.max(high,p.position.y);low=Math.min(low,p.position.y);assert.ok(Math.abs(p.position.y-world.heightAt(p.position.x,p.position.z))<.001);assert.ok(p.grounded);if(i===160)p.dash(new Set(['KeyD']));if(i===300)p.slide();}assert.ok(high-low>2.5);
 p.jump();p.update(.05,new Set());assert.ok(p.position.y>world.heightAt(p.position.x,p.position.z));p.jump();for(let i=0;i<400;i++)p.update(.008,new Set());assert.ok(p.grounded);assert.ok(Math.abs(p.position.y-world.heightAt(p.position.x,p.position.z))<.001);
});
test('fleeing goblins spawn and run on raised and sunken ground, not at global y=0',()=>{
 for(const [x,z]of [[50,9],[-70,-5],[0,-83],[60,70]]){const w=makeWorld(),sys=new EnemySystem(new THREE.Scene(),w);sys._spawnWave=()=>{};const e=sys.spawn(x,z),start=e.position.clone(),player={position:new THREE.Vector3(x-7,w.heightAt(x-7,z),z)};assert.equal(e.position.y,w.heightAt(x,z));for(let i=0;i<100;i++)sys.update(.016,player,i*.016);assert.ok(e.position.distanceTo(start)>5);assert.ok(Math.abs(e.position.y-w.heightAt(e.position.x,e.position.z))<.08);assert.ok(Number.isFinite(e.position.y));sys.dispose();}
});
test('ground blocks firearm and magic rays across a ridge',()=>{const w=makeWorld(),sys=new EnemySystem(new THREE.Scene(),w),origin=new THREE.Vector3(35,w.heightAt(35,73)+1.7,73),e=sys.spawn(90,73);const dir=e.position.clone().add(new THREE.Vector3(0,.85,0)).sub(origin).normalize();assert.ok(w.groundRayDistance(origin,dir,55)<50);assert.equal(sys.hitRay(origin,dir,80,999,1),0);sys.dispose();});
test('towers place on suitable raised ground, follow terrain and reject steep footprints',()=>{const w=makeWorld(),scene=new THREE.Scene(),progress=new Progression();progress.data.coins=10000;const enemies=new EnemySystem(scene,w),arcana=new Arcana(scene,enemies,fx,audio),defences=new Defences(scene,w,progress,enemies,arcana,fx,audio),p=new Player(new THREE.PerspectiveCamera(),w);p.position.set(58,3,20);defences.begin('bolt');defences.aim(p);assert.ok(defences.valid);assert.ok(defences.place());assert.equal(defences.items[0].group.position.y,3);assert.equal(defences.items[0].collider.y,3);const steep={...w,slopeAt:()=>.4};assert.equal(placementValid(steep,[],80,70),false);defences.restore();assert.equal(defences.items.length,1);assert.equal(progress.data.towers.length,1);defences.clear();});
test('saved tower upgrades are preserved when a new landmark requires a nearby safe position',()=>{const w=makeWorld(),p=new Progression();p.data.towers=[{id:1,type:'bolt',x:0,z:0,level:3}];w.colliders.push({x:0,z:0,w:4,d:4,h:3});const scene=new THREE.Scene(),enemies=new EnemySystem(scene,w),arcana=new Arcana(scene,enemies,fx,audio),d=new Defences(scene,w,p,enemies,arcana,fx,audio);assert.equal(p.data.towers.length,1);assert.equal(d.items.length,1);assert.equal(d.items[0].data.level,3);assert.ok(Math.hypot(p.data.towers[0].x,p.data.towers[0].z)>3.7);});
