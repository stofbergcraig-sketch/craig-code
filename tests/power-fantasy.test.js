import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Progression,SAVE_KEY} from '../src/progression.js';
import {STARTER_SHEKKLES} from '../src/config.js';
import {WEAPONS} from '../src/weapons.js';
import {EnemySystem} from '../src/enemies.js';
const memory=raw=>{const map=new Map(raw?[[SAVE_KEY,JSON.stringify(raw)]]:[]);return {getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};};

test('starting money is spendable and persists without granting kills or lifetime earnings',()=>{
 const storage=memory(),p=new Progression(storage);
 assert.equal(p.data.coins,STARTER_SHEKKLES);assert.equal(p.data.coins,100000);
 assert.equal(p.data.kills,0);assert.equal(p.data.totalEarned,0);
 const cost=p.getCost('shotgun');assert.ok(p.purchase('shotgun').ok);
 const loaded=new Progression(storage);assert.equal(loaded.data.coins,100000-cost);
 assert.ok(loaded.data.owned.includes('shotgun'));loaded.creditKill();loaded.save();
 assert.equal(new Progression(storage).data.coins,100001-cost);
 assert.equal(loaded.data.totalEarned,1);assert.equal(loaded.data.kills,1);
});
test('old saves receive one top-up while retaining progress and balances above 100000',()=>{
 for(const coins of [0,420,200000]){
  const storage=memory({version:2,coins,kills:321,totalEarned:456,owned:['hammer'],upgrades:{damage:2},towers:[{type:'bolt',x:12,z:12,level:2,padId:'test-bolt'}]});
  const p=new Progression(storage);assert.equal(p.data.coins,Math.max(coins,100000));
  assert.equal(p.data.kills,321);assert.equal(p.data.totalEarned,456);
  assert.ok(p.data.owned.includes('hammer'));assert.equal(p.data.upgrades.damage,2);
  assert.equal(p.data.towers[0].level,2);assert.equal(p.data.towers[0].padId,'test-bolt');
  p.data.coins=7;p.save();assert.equal(new Progression(storage).data.coins,7);
 }
});
test('both guns carry triple their former base magazines',()=>{
 assert.equal(WEAPONS.shotgun.ammo,8*3);assert.equal(WEAPONS.repeater.ammo,32*3);
});
test('early crowds reach 140 actual entities and remain bounded at each quality',()=>{
 const s=new EnemySystem(new THREE.Scene(),{colliders:[],spawnPoints:[]});
 try{
  const player={position:new THREE.Vector3()};
  for(let i=0;i<120;i++)s._spawnWave(player,{kills:0},.05);
  assert.equal(s.aliveCount,140);assert.equal(s.enemies.filter(e=>e.active).length,140);
  for(const [quality,cap,rate]of [['high',650,150],['medium',400,110],['low',200,80]]){
   s.setQuality(quality);assert.equal(s.spawnRateCap,rate);
   for(let i=0;i<400;i++)s._spawnWave(player,{kills:150000},.05);
   assert.equal(s.aliveCount,cap);assert.equal(s.enemies.filter(e=>e.active).length,cap);
  }
 }finally{s.dispose();}
});
