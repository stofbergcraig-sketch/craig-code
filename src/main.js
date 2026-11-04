import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { EnemySystem } from './enemies.js';
import { Effects } from './effects.js';
import { WeaponView, WEAPONS } from './weapons.js';
import { GameAudio } from './audio.js';
import { Progression } from './progression.js';
import { GameUI } from './ui.js';

const root=document.querySelector('#game');
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'}); }
catch {root.innerHTML='<div style="padding:3rem;color:white;background:#142b2a;font-family:sans-serif"><h1>MIREBREAK needs WebGL</h1><p>Please enable hardware acceleration in Chrome or Edge and restart the browser.</p></div>';throw new Error('WebGL unavailable');}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;root.appendChild(renderer.domElement);renderer.domElement.id='game-canvas';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x183536);scene.fog=new THREE.FogExp2(0x234541,.012);
scene.add(new THREE.HemisphereLight(0xb7d5bf,0x28231d,2.2));
const sun=new THREE.DirectionalLight(0xffdb9d,2.8);sun.position.set(-40,65,20);scene.add(sun);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.05,230);
const world=createWorld(scene),fx=new Effects(scene),audio=new GameAudio(),progress=new Progression();
const keys=new Set();let state='title',started=false,time=0,last=performance.now(),weapon='sword',attackTimer=0,reloadTimer=0,quickTimer=0,trapCooldown=0,hitStop=0,shake=0,lastHurt=-10,streak=0,streakTimer=0,saveTimer=0,mouseDown=false,shotCounter=0,pendingVictory=false;
const ammo={shotgun:8,repeater:32};const traps=[];let ui;
const player=new Player(camera,world,(name)=>{audio.play(name);if(name==='slam'){enemies.blast(player.position,progress.data.owned.includes('cataclysm')?18:9,160*damageMultiplier(),23*forceMultiplier());fx.ring(player.position,12);fx.burst(player.position,0xffd481,3);shake=.25;}});
const view=new WeaponView(camera);view.setWeapon(weapon);
let lastKillMarker=-1;
const enemies=new EnemySystem(scene,world,{
  onKill(enemy){
    const event=progress.creditKill();streak++;streakTimer=3;player.health=Math.min(100,player.health+.22);
    if(event?.milestone)ui?.notify(event.milestone,'unlock');
    if(event?.victory){pendingVictory=true;progress.data.victorySeen=true;progress.save();}
    if(time-lastKillMarker>.04){ui?.hit(true);lastKillMarker=time;}if(shotCounter++%7===0)audio.play('kill',.5);
  },
  onPlayerHit(amount){if(state!=='playing'||player.damageCooldown>0)return;player.health=Math.max(0,player.health-amount);player.damageCooldown=.25;lastHurt=time;shake=.11;audio.play('hurt',.5);ui.damage();if(player.health<=0)die();},
  onImpact(position,color,intensity){fx.burst(position,color||0xb6d741,Math.min(intensity||1,2));}
});
function damageMultiplier(){return 1+(progress.data.upgrades.damage||0)*.25;}
function forceMultiplier(){return 1+(progress.data.upgrades.force||0)*.25;}
function magazine(id=weapon){return (WEAPONS[id].ammo||0)+(progress.data.upgrades.capacity||0)*(id==='shotgun'?2:8);}
function applySettings(){const s=progress.data.settings;audio.setVolume(s.volume);enemies.setQuality(s.quality);renderer.setPixelRatio(Math.min(devicePixelRatio,s.quality==='low'?.75:s.quality==='high'?1.75:1.25));fx.max=s.quality==='low'?300:700;}
function setState(next){state=next;keys.clear();mouseDown=false;if(next!=='playing'&&document.pointerLockElement)document.exitPointerLock();ui.show(next==='playing'?null:next);}
async function lockAndPlay(){audio.unlock();if(!started){started=true;seedCrowd();}if(player.health<=0)player.respawn();setState('playing');try{await renderer.domElement.requestPointerLock();}catch {ui.notify('Click the game to capture your mouse.','info');}}
function seedCrowd(){for(let i=0;i<35;i++){const a=i*2.399,r=16+Math.random()*12;enemies.spawn(Math.sin(a)*r,12-Math.cos(a)*r,i%11===0?1:0);}}
function die(){progress.data.coins=Math.floor(progress.data.coins*.9);progress.save();audio.play('death');setState('death');}
ui=new GameUI(progress,{
  onPlay:lockAndPlay,onResume:lockAndPlay,onPause:()=>setState('pause'),
  onPurchase(id){const result=progress.purchase(id);ui.notify(result.message,result.ok?'unlock':'info');if(result.ok){audio.play('buy');if(WEAPONS[id])switchWeapon(id);ammo.shotgun=Math.max(ammo.shotgun,magazine('shotgun'));ammo.repeater=Math.max(ammo.repeater,magazine('repeater'));}return result;},
  onReset(){progress.reset();player.respawn();weapon='sword';view.setWeapon(weapon);started=false;enemies.clear();foundSecrets.clear();for(const t of traps)scene.remove(t.mesh);traps.length=0;pendingVictory=false;applySettings();setState('title');},
  onSettings(settings){Object.assign(progress.data.settings,settings);progress.save();applySettings();},
  onImport(text){const ok=progress.importSave(text);if(ok){switchWeapon('sword');foundSecrets.clear();for(const t of traps)scene.remove(t.mesh);traps.length=0;applySettings();ui.notify('Save restored. Your debt remembers.','unlock');}return ok;}
});
applySettings();ui.show('title');
function switchWeapon(id){if(!progress.data.owned.includes(id))return;weapon=id;reloadTimer=0;attackTimer=Math.min(attackTimer,.12);view.setWeapon(id);audio.play('switch',.4);}
function reload(){if(!WEAPONS[weapon].ammo||reloadTimer>0||ammo[weapon]>=magazine())return;reloadTimer=WEAPONS[weapon].reload||1.6;view.reload(reloadTimer);audio.play('reload');}
function attack(quick=false){
  const id=quick?'fists':weapon,w=WEAPONS[id];if(quick?quickTimer>0:attackTimer>0||reloadTimer>0)return;
  if(quick)quickTimer=w.cooldown;else attackTimer=w.cooldown;
  if(w.ammo&&ammo[id]<=0){reload();return;}
  view.attack();audio.play(id==='shotgun'||id==='repeater'?id:id==='fists'?'punch':'swing');
  const origin=camera.position.clone(),direction=player.forward();let hits=0;
  if(w.ammo){
    ammo[id]--;const shots=id==='shotgun'?10:1;
    for(let i=0;i<shots;i++){const spread=id==='shotgun'?.065:.007;const dir=direction.clone().add(new THREE.Vector3((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread)).normalize();hits+=enemies.hitRay(origin,dir,w.range,w.damage*damageMultiplier(),w.force*forceMultiplier(),id==='shotgun'?.52:.45);if(i<3)fx.tracer(origin.clone().add(new THREE.Vector3(.18,-.15,0).applyAxisAngle(new THREE.Vector3(0,1,0),player.yaw)),origin.clone().addScaledVector(dir,Math.min(w.range,24)));hitBarrels(origin,dir,w.range,w.damage);}
    shake=id==='shotgun'?.19:.06;
  }else{
    hits=enemies.hitCone(origin,direction,w.range,w.cosAngle??.2,w.damage*damageMultiplier(),w.force*forceMultiplier());
    hitBarrels(origin,direction,w.range,w.damage);
    if(id==='hammer'){const p=player.position.clone().addScaledVector(new THREE.Vector3(direction.x,0,direction.z).normalize(),4);const cat=progress.data.owned.includes('cataclysm');hits+=enemies.blast(p,cat?23:7,(cat?450:100)*damageMultiplier(),(cat?34:22)*forceMultiplier());fx.ring(p,cat?23:7,cat?0xaee75b:0xffbd61);}
  }
  if(hits){audio.play('hit',Math.min(1,hits*.18+.5));ui.hit();hitStop=w.ammo?.016:.045;shake=Math.max(shake,.11);}
}
function hitBarrels(origin,dir,range,damage){for(const barrel of world.barrels){if(!barrel.alive)continue;const target=new THREE.Vector3(barrel.x,.75,barrel.z);const delta=target.clone().sub(origin),along=delta.dot(dir);if(along>0&&along<range&&delta.addScaledVector(dir,-along).length()<1.2){barrel.hp-=damage;if(barrel.hp<=0)explodeBarrel(barrel);}}}
function explodeBarrel(barrel){if(!barrel.alive)return;barrel.alive=false;barrel.mesh.visible=false;const p=new THREE.Vector3(barrel.x,.6,barrel.z);enemies.blast(p,13,260,35);fx.ring(p,13,0xff8247);fx.burst(p,0xffad4e,4);audio.play('slam');shake=.24;for(const b of world.barrels)if(b.alive&&Math.hypot(b.x-barrel.x,b.z-barrel.z)<10)explodeBarrel(b);}
function deployTrap(){const level=progress.data.upgrades.trap||0;if(!level){ui.notify('Buy a Briar engine at the amber forge.','info');return;}if(trapCooldown>0)return;trapCooldown=Math.max(3,9-level*1.5);
  const group=new THREE.Group();const metal=new THREE.MeshStandardMaterial({color:0x344440,metalness:.65,roughness:.5}),glow=new THREE.MeshBasicMaterial({color:0xb4ed65});
  const foot=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,.2,6),metal);foot.position.y=.1;group.add(foot);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.11,.2,1.5,6),metal);shaft.position.y=.85;group.add(shaft);const core=new THREE.Mesh(new THREE.OctahedronGeometry(.38),glow);core.position.y=1.5;group.add(core);for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(1.8,.1,.18),metal);blade.position.y=.6+i*.2;blade.rotation.y=i*Math.PI/4;group.add(blade);}group.position.copy(player.position);scene.add(group);traps.push({mesh:group,t:0,pulse:0,life:55+level*15});while(traps.length>Math.min(5,level+1)){scene.remove(traps.shift().mesh);}fx.ring(group.position,3,0xb4ed65);audio.play('trap');ui.notify('Briar engine planted · keep the crowd coming','info');}
const foundSecrets=new Set();
// Optional exploration rewards complement the forge: collect the floating relic.
const relics=[{id:'axe',x:-25,z:7},{id:'shotgun',x:31,z:8},{id:'hammer',x:0,z:-48}].map(r=>{
  const mesh=new THREE.Group();const core=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshStandardMaterial({color:0xffd58c,emissive:0xd7933c,emissiveIntensity:1}));core.position.y=1.4;mesh.add(core);const ring=new THREE.Mesh(new THREE.TorusGeometry(.7,.035,5,20),new THREE.MeshBasicMaterial({color:0xb9ed98}));ring.position.y=1.4;ring.rotation.x=Math.PI/2;mesh.add(ring);
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#142b2a';ctx.fillRect(0,0,512,80);ctx.fillStyle='#f8dba4';ctx.font='bold 28px Arial';ctx.textAlign='center';ctx.fillText(WEAPONS[r.id].name,256,36);ctx.font='18px Arial';ctx.fillText('WEAPON RELIC · WALK TO COLLECT',256,64);const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthWrite:false}));label.position.y=2.5;label.scale.set(4,.625,1);mesh.add(label);mesh.position.set(r.x,0,r.z);scene.add(mesh);return {...r,mesh};
});
function interact(){const shop=world.shops.find(s=>Math.hypot(s.x-player.position.x,s.z-player.position.z)<6);if(shop){setState('shop');return;}ui.notify('Find the amber forge to buy weapons and upgrades.','info');}
const slots=['fists','sword','axe','hammer','shotgun','repeater'];
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(['Space','Tab','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(state==='playing')setState('pause');else if(state!=='title'&&state!=='death')setState('pause');return;}if(state!=='playing')return;keys.add(e.code);if(e.repeat)return;if(e.code==='Space')player.jump();if(e.code==='KeyQ')player.dash(keys);if(e.code==='ControlLeft'||e.code==='ControlRight')player.slide();if(e.code==='KeyR')reload();if(e.code==='KeyT')deployTrap();if(e.code==='KeyE')interact();if(e.code.startsWith('Digit'))switchWeapon(slots[Number(e.code.slice(5))-1]);});
document.addEventListener('keyup',e=>keys.delete(e.code));
document.addEventListener('mousemove',e=>{if(state==='playing'&&document.pointerLockElement)player.look(e.movementX,e.movementY,progress.data.settings.sensitivity);});
renderer.domElement.addEventListener('mousedown',e=>{if(state!=='playing')return;if(!document.pointerLockElement){renderer.domElement.requestPointerLock()?.catch(()=>{});return;}if(e.button===0){mouseDown=true;attack();}if(e.button===2)attack(true);});
document.addEventListener('mouseup',()=>mouseDown=false);document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='playing')setState('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')setState('pause');progress.save();});
window.addEventListener('blur',()=>{keys.clear();mouseDown=false;});
renderer.domElement.addEventListener('wheel',e=>{if(state!=='playing')return;const owned=slots.filter(id=>progress.data.owned.includes(id));switchWeapon(owned[(owned.indexOf(weapon)+(e.deltaY>0?1:-1)+owned.length)%owned.length]);},{passive:true});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('beforeunload',()=>progress.save());
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.04,(now-last)/1000);last=now;time+=dt;world.update?.(dt,time);
  scene.userData.playerX=player.position.x;scene.userData.playerZ=player.position.z;
  for(const r of relics){r.mesh.visible=!progress.data.owned.includes(r.id);r.mesh.children[0].rotation.y=time;r.mesh.children[0].position.y=1.4+Math.sin(time*2)*.12;if(state==='playing'&&r.mesh.visible&&Math.hypot(r.x-player.position.x,r.z-player.position.z)<2){progress.data.owned.push(r.id);progress.save();switchWeapon(r.id);ui.notify(WEAPONS[r.id].name+' FOUND · permanently unlocked','unlock');audio.play('buy');}}
  if(state==='playing'){
    attackTimer=Math.max(0,attackTimer-dt);quickTimer=Math.max(0,quickTimer-dt);trapCooldown=Math.max(0,trapCooldown-dt);
    if(reloadTimer>0){reloadTimer-=dt;if(reloadTimer<=0){ammo[weapon]=magazine();audio.play('reload',.5);}}
    if(mouseDown)attack();
    const simDt=hitStop>0?dt*.18:dt;hitStop=Math.max(0,hitStop-dt);
    // Substeps make collisions reliable even after a long frame.
    const steps=Math.ceil(simDt/.012);for(let i=0;i<steps;i++)player.update(simDt/steps,keys);
    enemies.update(simDt,player,time,{kills:progress.data.kills,power:progress.data.owned.includes('cataclysm')?1:0});
    for(let i=traps.length-1;i>=0;i--){const t=traps[i],level=progress.data.upgrades.trap;t.t+=simDt;t.pulse-=simDt;t.mesh.rotation.y+=simDt*3;if(t.pulse<=0){t.pulse=Math.max(.32,.85-level*.12);const radius=8+level*3;enemies.blast(t.mesh.position,radius,(75+level*35)*damageMultiplier(),12);fx.ring(t.mesh.position,radius,0xa9db67);}if(t.t>t.life){scene.remove(t.mesh);traps.splice(i,1);}}
    if(time-lastHurt>4)player.health=Math.min(100,player.health+dt*5);
    for(const secret of world.secrets){const id=secret.name;if(!(progress.data.secrets||[]).includes(id)&&!foundSecrets.has(id)&&Math.hypot(secret.x-player.position.x,secret.z-player.position.z)<2.5){foundSecrets.add(id);progress.data.secrets??=[];progress.data.secrets.push(id);progress.data.coins+=secret.reward||150;progress.save();ui.notify('Secret found: '+id+' · +'+(secret.reward||150)+' scrap','unlock');audio.play('buy');}}
    streakTimer-=dt;if(streakTimer<=0)streak=0;
    if(pendingVictory){pendingVictory=false;audio.play('victory');setState('victory');}
  }else if(!started){camera.position.set(15,8,24);camera.lookAt(-3,2,-5);}
  fx.update(dt);shake=Math.max(0,shake-dt);if(state==='playing'&&shake>0){const amount=shake*progress.data.settings.shake*.025;camera.rotation.z+=(Math.random()-.5)*amount;camera.position.y+=(Math.random()-.5)*amount;}
  view.update(dt,{speed:Math.hypot(player.velocity.x,player.velocity.z),grounded:player.grounded,sprinting:keys.has('ShiftLeft'),sliding:player.slideTime>0,time});audio.update?.(dt,state==='playing'?Math.hypot(player.velocity.x,player.velocity.z):0,player.grounded);
  renderer.render(scene,camera);if(started&&state!=='title')view.render?.(renderer);
  const nearShop=world.shops.some(s=>Math.hypot(s.x-player.position.x,s.z-player.position.z)<6);
  ui.update({health:player.health,weapon:WEAPONS[weapon].name,weaponId:weapon,ammo:WEAPONS[weapon].ammo?ammo[weapon]:null,reserve:WEAPONS[weapon].ammo?'∞':null,kills:progress.data.kills,coins:progress.data.coins,zone:world.zoneAt(player.position.x,player.position.z),dash:player.dashCooldown,trapCooldown,streak,alive:enemies.aliveCount,interact:nearShop?'OPEN THE AMBER FORGE':undefined});
  saveTimer+=dt;if(saveTimer>5){progress.save();saveTimer=0;}
}
requestAnimationFrame(frame);
// Explicitly development-only. Vite removes this branch in the production build.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))window.__MIREBREAK__={player,enemies,progress,world,fx,view,ammo,keys,get state(){return state},get weapon(){return weapon},attack,switchWeapon,reload,deployTrap,interact,setState,start:lockAndPlay,save:()=>progress.save(),get traps(){return traps},get renderer(){return renderer},testVictory(){progress.data.kills=149999;const e=enemies.spawn(player.position.x+2,player.position.z);if(e)enemies.blast(e.position,2,1e6,0);}};
