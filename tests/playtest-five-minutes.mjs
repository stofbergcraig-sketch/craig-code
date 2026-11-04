// Real elapsed-time browser play session. Controls use keyboard/mouse handlers;
// diagnostics only observe state. No position, currency, kills or health edits.
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
let steer={},mx=480,my=270;
process.stdin.setEncoding('utf8');process.stdin.on('data',data=>{try{steer={...steer,...JSON.parse(data.trim())};console.log('STEERING',steer);}catch{}});
const p=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
const observe=()=>p.evaluate(()=>{const g=window.__MIREBREAK__;return {pos:g.player.position.toArray(),yaw:g.player.yaw,pitch:g.player.pitch,health:g.player.health,state:g.state,kills:g.progress.data.kills,coins:g.progress.data.coins,alive:g.enemies.aliveCount,weapon:g.weapon,ammo:{...g.ammo},towers:g.progress.data.towers.length,pads:g.defences.pads.filter(p=>p.display).map(p=>({id:p.id,type:p.type,x:p.x,z:p.z})),targets:g.enemies.enemies.filter(e=>e.active).map(e=>({id:e.id,x:e.position.x,y:e.position.y+.85,z:e.position.z})),zone:g.world.zoneAt(g.player.position.x,g.player.position.z)};});
async function aim(x,y,z){const s=await observe(),dx=x-s.pos[0],dy=y-(s.pos[1]+1.7),dz=z-s.pos[2],yaw=Math.atan2(-dx,-dz),pitch=Math.atan2(dy,Math.hypot(dx,dz)),turn=Math.atan2(Math.sin(yaw-s.yaw),Math.cos(yaw-s.yaw)),look=Math.max(-.9,Math.min(.9,pitch))-s.pitch;
 // Dispatch relative mouse movement through the exact normal look handler.
 await p.evaluate(({x,y})=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:x,movementY:y,bubbles:true})),{x:-turn/.0018,y:-look/.0018});
}
async function walkTo(x,z,maxMs=14000){const start=Date.now();await p.keyboard.down('Shift');await p.keyboard.down('w');while(Date.now()-start<maxMs){const s=await observe();if(Math.hypot(x-s.pos[0],z-s.pos[2])<3.5)break;await aim(x,s.pos[1]+1.7,z);await p.waitForTimeout(250);}await p.keyboard.up('w');await p.keyboard.up('Shift');}
try{
 await p.goto('http://127.0.0.1:5173/?test=1');await p.waitForFunction(()=>!!window.__MIREBREAK__);await p.click('[data-action=play]');console.log('INITIAL',JSON.stringify(await observe(),(k,v)=>k==='targets'?v.length:v));
 await walkTo(-7,5);await p.keyboard.press('e');await p.waitForSelector('[data-id=shotgun]');
 for(const id of ['shotgun','repeater','hammer','gravebreaker','eclipse','gravehook','cataclysm','damage','damage','force','trap'])await p.click('[data-id="'+id+'"]');
 await p.click('[data-action=resume]');const pads=(await observe()).pads,bolt=pads.find(p=>p.type==='bolt');await walkTo(bolt.x+3.2,bolt.z);await p.keyboard.press('f');
 const start=Date.now();let paused=0,last=Date.now(),nextReport=0,lastTrap=-1,lastDash=-1,lastJump=-1,lastReload=-1,sequence=0;
 while(Date.now()-start-paused<300000){const now=Date.now(),s=await observe();if(s.state!=='playing'){paused+=now-last;last=now;console.log('MENU',s.state);await p.click('[data-action=resume]');continue;}last=now;const elapsed=(now-start-paused)/1000;
   const cycle=steer.weapon||(['sword','shotgun','repeater','hammer','gravebreaker','eclipse','gravehook','hammer'][Math.min(7,Math.floor(elapsed/38))]);
   const slots={sword:'2',shotgun:'5',repeater:'6',hammer:'4',gravebreaker:'8',eclipse:'9',gravehook:'7'};if(s.weapon!==cycle)await p.keyboard.press(slots[cycle]);
   const targets=s.targets.sort((a,b)=>Math.hypot(a.x-s.pos[0],a.z-s.pos[2])-Math.hypot(b.x-s.pos[0],b.z-s.pos[2])),target=targets[0];
   const region=steer.region||(elapsed<100?'courtyard':elapsed<170?'gravewood':elapsed<245?'camp':'courtyard'),goal=region==='gravewood'?{x:-43,z:10}:region==='camp'?{x:43,z:9}:{x:0,z:12};
   const goalDistance=Math.hypot(goal.x-s.pos[0],goal.z-s.pos[2]);
   if(target&&(goalDistance<26||Math.hypot(target.x-s.pos[0],target.z-s.pos[2])<8)){await aim(target.x,target.y,target.z);}else await aim(goal.x,s.pos[1]+1.7,goal.z);
   await p.keyboard.down('Shift');await p.keyboard.down('w');await p.mouse.down();
   if((s.ammo[s.weapon]??1)===0&&elapsed-lastReload>2){await p.keyboard.press('r');lastReload=elapsed;}
   if(elapsed-lastTrap>14){await p.keyboard.press('t');lastTrap=elapsed;}
   if(elapsed-lastDash>6){await p.keyboard.press('q');lastDash=elapsed;}
   if(elapsed-lastJump>9){await p.keyboard.press('Space');if(sequence++%2===0)await p.keyboard.press('Space');lastJump=elapsed;}
   if(elapsed>=nextReport){await p.screenshot({path:'/tmp/mirebreak-play-'+Math.floor(elapsed)+'.png'});console.log('PLAY_SAMPLE',JSON.stringify({elapsed:Math.round(elapsed),pos:s.pos,health:s.health,kills:s.kills,coins:s.coins,alive:s.alive,weapon:s.weapon,ammo:s.ammo,towers:s.towers,zone:s.zone}));nextReport+=30;}
   await p.waitForTimeout(250);
 }
 await p.mouse.up();await p.keyboard.up('w');await p.keyboard.up('Shift');const result=await observe();await p.screenshot({path:'/tmp/mirebreak-play-final.png'});const report={activeWallSeconds:(Date.now()-start-paused)/1000,...result,targets:result.targets.length,errors};await writeFile('/tmp/mirebreak-five-minute-result.json',JSON.stringify(report,null,2));console.log('FIVE_MINUTE_RESULT',JSON.stringify(report));assert.ok(report.activeWallSeconds>=300);assert.equal(report.health,100);assert.ok(report.kills>0);assert.deepEqual(errors,[]);
}finally{await browser.close();process.stdin.pause();}
