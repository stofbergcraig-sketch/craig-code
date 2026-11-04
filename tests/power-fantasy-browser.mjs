import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // An existing save must be upgraded without losing weapons, kills or capacity.
 await page.addInitScript(()=>{if(!localStorage.getItem('power-fantasy-fixture')){localStorage.setItem('mirebreak.goblin-debt.v1',JSON.stringify({version:2,kills:42,coins:123,totalEarned:56,owned:['shotgun','repeater','hammer'],upgrades:{capacity:2},settings:{quality:'low'}}));localStorage.setItem('power-fantasy-fixture','1');}});
 await page.goto('http://127.0.0.1:5173/?test=1');await page.waitForFunction(()=>!!window.__MIREBREAK__);
 assert.deepEqual(await page.evaluate(()=>{const g=window.__MIREBREAK__;return {coins:g.progress.data.coins,kills:g.progress.data.kills,earned:g.progress.data.totalEarned,ammo:{...g.ammo}};}),{coins:100000,kills:42,earned:56,ammo:{shotgun:36,repeater:144}});
 await page.click('[data-action=play]');assert.ok(await page.evaluate(()=>!!document.pointerLockElement));
 const attacks=await page.evaluate(()=>{
  const g=window.__MIREBREAK__;g.setState('pause');g.enemies.clear();g.player.respawn();
  const spawn=g.enemies._spawnWave,hit=g.enemies.onPlayerHit;let count=0;
  g.enemies._spawnWave=()=>{};g.enemies.onPlayerHit=damage=>{count++;hit(damage);};
  try{const e=g.enemies.spawn(.7,12);if(!e)throw Error('Attack fixture blocked');
   for(let i=0;i<200;i++){e.position.set(.7,g.player.position.y,12);e.velocity.set(0,0,0);e.attack=0;g.enemies.update(.016,g.player,i*.016);}
   assertHealth();function assertHealth(){if(g.player.health!==100)throw Error('Goblin dealt damage');}
   hit(1000000);if(g.player.health!==100)throw Error('Lethal goblin damage was applied');
   return count;
  }finally{g.enemies._spawnWave=spawn;g.enemies.onPlayerHit=hit;g.enemies.clear();}
 });assert.ok(attacks>5);console.log('Real close-range AI attacks ignored:',attacks);
 await page.click('[data-action=resume]');
 await page.evaluate(()=>{const g=window.__MIREBREAK__;g.enemies.clear();g.enemies._spawnWave=()=>{};});
 for(const [weapon,key,capacity]of [['shotgun','5',36],['repeater','6',144]]){
  await page.keyboard.press(key);await page.waitForTimeout(150);
  await page.mouse.click(480,270);await page.waitForFunction(({weapon,capacity})=>window.__MIREBREAK__.ammo[weapon]===capacity-1,{weapon,capacity});
  await page.waitForFunction(capacity=>document.querySelector('#ammo-display').textContent===String(capacity-1),capacity);
  await page.keyboard.press('r');await page.waitForFunction(({weapon,capacity})=>window.__MIREBREAK__.ammo[weapon]===capacity,{weapon,capacity},{timeout:15000});
 }
 // Spend below the grant; reloading must retain spending, not top up again.
 await page.evaluate(()=>{const g=window.__MIREBREAK__;g.setState('pause');g.progress.data.coins=100;g.progress.save();});
 await page.reload();await page.waitForFunction(()=>!!window.__MIREBREAK__);
 assert.equal(await page.evaluate(()=>window.__MIREBREAK__.progress.data.coins),100);
 assert.equal(await page.evaluate(()=>window.__MIREBREAK__.progress.data.kills),42);
 assert.equal(await page.evaluate(()=>window.__MIREBREAK__.enemies.maxAlive),200);
 // Reproduce the repeat playtest's tree contact. Backing out must work using
 // normal controls; a forward-only bot stopping at a tree is not a soft lock.
 await page.click('[data-action=play]');
 await page.evaluate(()=>{const g=window.__MIREBREAK__;g.enemies.clear();g.enemies._spawnWave=()=>{};g.player.position.set(-49.45820036,g.world.heightAt(-49.45820036,30.1748865),30.1748865);g.player.velocity.set(0,0,0);g.player.yaw=30.1968;g.player.grounded=true;});
 await page.keyboard.down('s');await page.waitForFunction(()=>{const p=window.__MIREBREAK__.player.position;return Math.hypot(p.x+49.45820036,p.z-30.1748865)>3;},null,{timeout:15000});await page.keyboard.up('s');
 assert.equal(await page.evaluate(()=>window.__MIREBREAK__.player.health),100);
 assert.deepEqual(errors,[]);console.log('Power-fantasy browser passed: legacy top-up, preserved progress, tripled upgraded magazines, real keyboard firing/reloading, invulnerability, save/reload and lower-quality cap.');
}finally{await browser.close();}
