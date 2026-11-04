import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Progression,GOAL} from '../src/progression.js';
import {EnemySystem} from '../src/enemies.js';
import {Player} from '../src/player.js';
const storage=()=>{const map=new Map();return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};
test('purchases, settings and genuine kill credit persist; invalid backups preserve data',()=>{
 const s=storage(),p=new Progression(s);p.data.coins=500;p.creditKill();assert.equal(p.data.kills,1);assert.ok(p.purchase('hammer').ok);p.data.settings.volume=.2;p.save();const restored=new Progression(s);assert.ok(restored.data.owned.includes('hammer'));assert.equal(restored.data.kills,1);assert.equal(restored.data.settings.volume,.2);assert.equal(restored.importSave('bad'),false);assert.equal(restored.data.kills,1);restored.reset();assert.equal(restored.data.kills,0);
});
test('goal triggers exactly at 150000 once; storage errors graceful',()=>{const p=new Progression({getItem:()=>'{broken',setItem:()=>{throw Error('denied');}});assert.equal(p.storageStatus,'recovered');p.data.kills=GOAL-2;assert.equal(p.creditKill().victory,false);assert.equal(p.creditKill().victory,true);assert.equal(p.creditKill().victory,false);assert.equal(p.save(),false);});
test('enemy defeat credited once across overlapping damage; walls block bullets',()=>{let count=0;const world={colliders:[],spawnPoints:[]};const e=new EnemySystem(new THREE.Scene(),world,{onKill:()=>count++});e.spawn(0,-2);e.hitCone(new THREE.Vector3(0,1.7,0),new THREE.Vector3(0,0,-1),4,.2,100,20);e.blast(new THREE.Vector3(0,0,-2),5,100,20);assert.equal(count,1);e.clear();assert.equal(e.aliveCount,0);world.colliders.push({x:0,z:-2,w:8,d:1,h:4});e.spawn(0,-4);assert.equal(e.hitRay(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,-1),10,100,20),0);e.setQuality('low');assert.equal(e.maxAlive,200);e.dispose();});
test('movement supports jumping, double jump, dash, collision and ground landing',()=>{const p=new Player(new THREE.PerspectiveCamera(),{colliders:[{x:0,z:-5,w:8,d:1,h:5}]});p.position.set(0,0,0);const keys=new Set(['KeyW']);for(let i=0;i<100;i++)p.update(.01,keys);assert.ok(p.position.z>-4.2);p.jump();p.update(.1,new Set());assert.ok(p.position.y>0);p.jump();assert.equal(p.jumps,2);p.dash(new Set());assert.ok(p.dashCooldown>0);for(let i=0;i<300;i++)p.update(.01,new Set());assert.equal(p.position.y,0);assert.ok(p.grounded);p.slide();assert.ok(p.slideTime>0);});
