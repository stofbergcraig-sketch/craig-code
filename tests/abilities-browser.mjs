import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:960,height:540}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:5173/?test=1');await p.waitForFunction(()=>!!window.__MIREBREAK__);
 for(const id of ['gravehook','gravebreaker','eclipse','excalibur']){
   await p.evaluate(id=>{const g=window.__MIREBREAK__;g.progress.data.owned=['fists','sword','axe','hammer','shotgun','repeater','gravehook','gravebreaker','eclipse','excalibur'];g.progress.data.kills=20000;g.progress.data.equipped=id;g.progress.save();},id);await p.reload();await p.waitForFunction(()=>!!window.__MIREBREAK__);await p.click('[data-action=play]');
   await p.evaluate(()=>{const g=window.__MIREBREAK__;g.enemies._spawnWave=()=>{};g.enemies.clear();g.player.respawn();g.player.update(0,new Set());const e=g.enemies.spawn(0,5);e.stun=10;});
   if(id==='excalibur'){await p.keyboard.down('f');await p.waitForFunction(()=>window.__MIREBREAK__.charge>=1,null,{timeout:15000});await p.keyboard.up('f');}
   else await p.keyboard.press('f');
   const result=await p.evaluate(()=>{const g=window.__MIREBREAK__;for(let i=0;i<80;i++)g.arcana.update(.016);const e=g.enemies.enemies.find(e=>e.position.z===5);return {kills:g.progress.data.kills,hp:e?.hp,pulled:e?.velocity.z>0,active:g.arcana.pool.filter(p=>p.active).length};});
   if(id==='gravehook'){assert.ok(result.pulled);assert.equal(result.hp,23);}else assert.ok(result.kills>20000,id+' special must defeat actual enemy');console.log(id,'special verified',result);
 }
 assert.deepEqual(errors,[]);console.log('All four weapon specials verified in browser.');
}finally{await b.close();}
