import * as THREE from 'three';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { EnemySystem } from './enemies.js';
import { Effects } from './effects.js';
import { WeaponView, WEAPONS, MELEE_TIMINGS } from './weapons.js';
import { GameAudio } from './audio.js';
import { Progression } from './progression.js';
import { GameUI } from './ui.js';
import {Arcana} from './arcana.js';
import {Defences} from './defences.js';
import {LegendarySite} from './legendary.js';
import {TOWER_TYPES} from './progression.js';

const root=document.querySelector('#game');
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'}); }
catch {root.innerHTML='<div style="padding:3rem;color:white;background:#142b2a;font-family:sans-serif"><h1>MIREBREAK needs WebGL</h1><p>Please enable hardware acceleration in Chrome or Edge and restart the browser.</p></div>';throw new Error('WebGL unavailable');}
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;root.appendChild(renderer.domElement);renderer.domElement.id='game-canvas';
const scene=new THREE.Scene();scene.background=new THREE.Color(0x183536);scene.fog=new THREE.FogExp2(0x234541,.009);
scene.add(new THREE.HemisphereLight(0xb7d5bf,0x28231d,2.2));
const sun=new THREE.DirectionalLight(0xffdb9d,2.8);sun.position.set(-40,65,20);scene.add(sun);
const camera=new THREE.PerspectiveCamera(76,innerWidth/innerHeight,.05,350);
const world=createWorld(scene),fx=new Effects(scene,world),audio=new GameAudio(),progress=new Progression();
const keys=new Set();let state='title',started=false,time=0,last=performance.now(),weapon='sword',attackTimer=0,reloadTimer=0,quickTimer=0,trapCooldown=0,hitStop=0,shake=0,lastHurt=-10,streak=0,streakTimer=0,saveTimer=0,mouseDown=false,shotCounter=0,pendingVictory=false;
const ammo={shotgun:8,repeater:32};const traps=[];let ui;
weapon=progress.data.equipped;
const pendingAttacks=[];let specialCooldown=0,charge=0,charging=false,lastLookX=0,lastLookY=0;
const player=new Player(camera,world,(name)=>{audio.play(name);if(name==='slam'){enemies.blast(player.position,progress.data.owned.includes('cataclysm')?18:9,160*damageMultiplier(),23*forceMultiplier());fx.ring(player.position,12);fx.crack(player.position,7);fx.burst(player.position,0xffd481,3);shake=.25;}});
const view=new WeaponView(camera);view.setWeapon(weapon);
const legendary=new LegendarySite(scene,world,progress,fx,audio);
let lastKillMarker=-1;
const enemies=new EnemySystem(scene,world,{
  onKill(enemy){
    const event=progress.creditKill();streak++;streakTimer=3;player.health=Math.min(100,player.health+.22);
    ui?.reward();audio.play('coin',.12);
    if(event?.milestone)ui?.notify(event.milestone,'unlock');
    if(event?.victory){pendingVictory=true;progress.data.victorySeen=true;progress.save();}
    if(time-lastKillMarker>.04){ui?.hit(true);lastKillMarker=time;}if(shotCounter++%7===0)audio.play('kill',.5);
  },
  onPlayerHit(amount){if(state!=='playing'||player.damageCooldown>0)return;player.health=Math.max(0,player.health-amount);player.damageCooldown=.25;lastHurt=time;shake=.11;audio.play('hurt',.5);ui.damage();if(player.health<=0)die();},
  onImpact(position,color,intensity){fx.burst(position,color||0xb6d741,Math.min(intensity||1,2));}
});
const arcana=new Arcana(scene,enemies,fx,audio),defences=new Defences(scene,world,progress,enemies,arcana,fx,audio);
function damageMultiplier(){return 1+(progress.data.upgrades.damage||0)*.25;}
function forceMultiplier(){return 1+(progress.data.upgrades.force||0)*.25;}
function magazine(id=weapon){return (WEAPONS[id].ammo||0)+(progress.data.upgrades.capacity||0)*(id==='shotgun'?2:8);}
function applySettings(){const s=progress.data.settings;audio.setVolume(s.volume);enemies.setQuality(s.quality);renderer.setPixelRatio(Math.min(devicePixelRatio,s.quality==='low'?.75:s.quality==='high'?1.75:1.25));fx.max=s.quality==='low'?300:700;}
function setState(next){state=next;keys.clear();mouseDown=false;charging=false;charge=0;if(next!=='playing'){pendingAttacks.length=0;if(document.pointerLockElement)document.exitPointerLock();}ui.show(next==='playing'?null:next);}
async function lockAndPlay(){audio.unlock();if(!started){started=true;seedCrowd();}if(player.health<=0)player.respawn();setState('playing');try{await renderer.domElement.requestPointerLock();}catch {ui.notify('Click the game to capture your mouse.','info');}}
function seedCrowd(){for(let i=0;i<35;i++){const a=i*2.399,r=16+Math.random()*12;enemies.spawn(Math.sin(a)*r,12-Math.cos(a)*r,i%11===0?1:0);}}
function die(){progress.data.coins=Math.floor(progress.data.coins*.9);progress.save();audio.play('death');setState('death');}
ui=new GameUI(progress,{
  onPlay:lockAndPlay,onResume:lockAndPlay,onPause:()=>setState('pause'),
  onArsenal:()=>setState('arsenal'),onTowers:()=>setState('towers'),
  onEquip(id){switchWeapon(id);lockAndPlay();},
  onTowerUpgrade(id){const ok=progress.upgradeTower(id);ui.notify(ok?'Tower upgraded. Runes reinforced.':'Not enough Shekkles or already maximum level.',ok?'unlock':'info');if(ok)audio.play('buy');},
  onPurchase(id){if(id.startsWith('tower:')){defences.begin(id.slice(6));lockAndPlay();return {placing:true};}const result=progress.purchase(id);ui.notify(result.message,result.ok?'unlock':'info');if(result.ok){audio.play('buy');if(WEAPONS[id])switchWeapon(id);ammo.shotgun=Math.max(ammo.shotgun,magazine('shotgun'));ammo.repeater=Math.max(ammo.repeater,magazine('repeater'));}return result;},
  onReset(){ui.resetRewards();progress.reset();player.respawn();weapon='sword';view.setWeapon(weapon);started=false;enemies.clear();foundSecrets.clear();clearTraps();defences.restore();arcana.clear();legendary.reset();ammo.shotgun=8;ammo.repeater=32;specialCooldown=0;pendingVictory=false;applySettings();setState('title');},
  onSettings(settings){Object.assign(progress.data.settings,settings);progress.save();applySettings();},
  onImport(text){const ok=progress.importSave(text);if(ok){ui.resetRewards();switchWeapon(progress.data.equipped);foundSecrets.clear();clearTraps();defences.restore();arcana.clear();legendary.reset();applySettings();ui.notify('Save restored. Your debt remembers.','unlock');}return ok;}
});
try{ui.previews=view.thumbnails();}catch{ /* Menus remain usable if a second WebGL context is unavailable. */ }
applySettings();ui.show('title');
function switchWeapon(id){if(!WEAPONS[id]||!progress.data.owned.includes(id))return;weapon=id;progress.data.equipped=id;progress.save();reloadTimer=0;pendingAttacks.length=0;charging=false;attackTimer=Math.min(attackTimer,.12);view.setWeapon(id);audio.play('switch',.4);}
function reload(){if(!WEAPONS[weapon].ammo||reloadTimer>0||ammo[weapon]>=magazine())return;reloadTimer=WEAPONS[weapon].reload||1.6;view.reload(reloadTimer);audio.play('reload');}
function attack(quick=false){
  if(defences.pending||legendary.elapsed>=0||charging)return;
  const id=quick?'fists':weapon,w=WEAPONS[id];if(quick?quickTimer>0:attackTimer>0||reloadTimer>0)return;
  if(quick)quickTimer=w.cooldown;else attackTimer=w.cooldown;
  if(w.ammo&&ammo[id]<=0){reload();return;}
  view.attack(quick);audio.play(id==='shotgun'||id==='repeater'?id:id==='fists'?'punch':'swing');
  if(w.ammo||id==='eclipse')resolveAttack(id);else pendingAttacks.push({id,delay:MELEE_TIMINGS[id].contact});
}
function resolveAttack(id){
  if(id==='earthbreaker'){enemies.blast(player.position,22,700*damageMultiplier(),48);fx.ring(player.position,22,0x9e87bc);fx.crack(player.position,11);fx.burst(player.position,0x7b718c,4);audio.play('slam');shake=.35;return;}
  const w=WEAPONS[id];
  const origin=camera.position.clone(),direction=player.forward();let hits=0;
  if(id==='eclipse'){
    arcana.fire(origin,direction,{damage:w.damage*damageMultiplier(),bounce:shotCounter++%3===0?1:0,color:0xc3a4df});audio.play('magic');return;
  }else if(w.ammo){
    ammo[id]--;const shots=id==='shotgun'?10:1;
    for(let i=0;i<shots;i++){const spread=id==='shotgun'?.065:.007;const dir=direction.clone().add(new THREE.Vector3((Math.random()-.5)*spread,(Math.random()-.5)*spread,(Math.random()-.5)*spread)).normalize();hits+=enemies.hitRay(origin,dir,w.range,w.damage*damageMultiplier(),w.force*forceMultiplier(),id==='shotgun'?.52:.45);if(i<3)fx.tracer(origin.clone().add(new THREE.Vector3(.18,-.15,0).applyAxisAngle(new THREE.Vector3(0,1,0),player.yaw)),origin.clone().addScaledVector(dir,Math.min(w.range,24)));hitBarrels(origin,dir,w.range,w.damage);}
    shake=id==='shotgun'?.19:.06;
  }else{
    hits=enemies.hitCone(origin,direction,w.range,w.cosAngle??.2,w.damage*damageMultiplier(),w.force*forceMultiplier());
    hitBarrels(origin,direction,w.range,w.damage);
    const groundDistance=world.groundRayDistance(origin,direction,w.range),groundHit=direction.y<-.2&&groundDistance<w.range-.05;if(groundHit){const contact=origin.clone().addScaledVector(direction,groundDistance);fx.crack(contact,id==='gravebreaker'?6:id==='hammer'?4:id==='fists'?.8:2);fx.burst(contact,0x817962,1);audio.play('hit',.45);}
    if(id!=='fists'){const center=origin.clone().addScaledVector(direction,Math.min(4,w.range*.6));fx.tracer(center.clone().add(new THREE.Vector3(-1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),player.yaw)),center.clone().add(new THREE.Vector3(1,-.3,0).applyAxisAngle(new THREE.Vector3(0,1,0),player.yaw)),id==='excalibur'?0xd5efaf:0x90ae9d);}
    if(id==='hammer'){const p=player.position.clone().addScaledVector(new THREE.Vector3(direction.x,0,direction.z).normalize(),4);const cat=progress.data.owned.includes('cataclysm');hits+=enemies.blast(p,cat?23:7,(cat?450:100)*damageMultiplier(),(cat?34:22)*forceMultiplier());fx.ring(p,cat?23:7,cat?0xaee75b:0xffbd61);if(!groundHit)fx.crack(p,cat?8:4);}
  }
  if(hits){audio.play('hit',Math.min(1,hits*.18+.5));ui.hit();hitStop=w.ammo?.016:.045;shake=Math.max(shake,.11);}
}
function specialAttack(){
  if(specialCooldown>0||!WEAPONS[weapon].special||defences.pending||legendary.elapsed>=0)return;
  const w=WEAPONS[weapon],origin=camera.position.clone(),dir=player.forward();
  if(weapon==='excalibur'&&!charging){charging=true;charge=0;audio.play('charge');return;}
  view.special();specialCooldown=w.specialCooldown;
  if(weapon==='gravehook'){
    const target=arcana.target(origin,26,dir,.82);arcana.fire(origin,dir,{target,speed:58,damage:12,force:0,hookOrigin:origin.clone(),onHit(e){e.stun=1.15;e.velocity.copy(player.position).sub(e.position).normalize().multiplyScalar(23);e.velocity.y=4;fx.tracer(origin,e.position.clone().setY(1),0xa2c7ab);}});audio.play('hook');
  }else if(weapon==='gravebreaker'){
    pendingAttacks.push({id:'earthbreaker',delay:MELEE_TIMINGS.gravebreaker.contact});
  }else if(weapon==='eclipse'){
    const seen=new Set();for(let i=0;i<10;i++){const e=arcana.target(origin,48,null,-1,seen);if(e)seen.add(e.id);const direction=e?e.position.clone().add(new THREE.Vector3(0,.8,0)).sub(origin).normalize():dir.clone().applyAxisAngle(new THREE.Vector3(0,1,0),(i-4.5)*.055);arcana.fire(origin,direction,{target:e,damage:200*damageMultiplier(),bounce:1,color:0xc2a0ed});}fx.ring(player.position,4,0xbda0d9);audio.play('magic');
  }else if(weapon==='excalibur'){
    enemies.hitCone(origin,dir,26,.6,600*damageMultiplier(),38);for(let i=-2;i<=2;i++)arcana.fire(origin,dir.clone().applyAxisAngle(new THREE.Vector3(0,1,0),i*.12),{damage:300,pierce:8,color:0xe8e9a9,size:2});fx.ring(player.position,7,0xe2e7b1);audio.play('legendary',.6);charging=false;charge=0;
  }
}
function hitBarrels(origin,dir,range,damage){for(const barrel of world.barrels){if(!barrel.alive)continue;const target=new THREE.Vector3(barrel.x,barrel.mesh.position.y+.75,barrel.z);const delta=target.clone().sub(origin),along=delta.dot(dir);if(along>0&&along<range&&delta.addScaledVector(dir,-along).length()<1.2){barrel.hp-=damage;if(barrel.hp<=0)explodeBarrel(barrel);}}}
function explodeBarrel(barrel){if(!barrel.alive)return;barrel.alive=false;barrel.mesh.visible=false;const p=new THREE.Vector3(barrel.x,barrel.mesh.position.y+.6,barrel.z);enemies.blast(p,13,260,35);fx.ring(p,13,0xff8247);fx.burst(p,0xffad4e,4);audio.play('slam');shake=.24;for(const b of world.barrels)if(b.alive&&Math.hypot(b.x-barrel.x,b.z-barrel.z)<10)explodeBarrel(b);}
function removeTrap(t){scene.remove(t.mesh);t.mesh.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
function clearTraps(){for(const t of traps)removeTrap(t);traps.length=0;}
function deployTrap(){const level=progress.data.upgrades.trap||0;if(!level){ui.notify('Buy a Thorn engine at the amber forge.','info');return;}if(trapCooldown>0)return;trapCooldown=Math.max(3,9-level*1.5);
  const group=new THREE.Group();const metal=new THREE.MeshStandardMaterial({color:0x344440,metalness:.65,roughness:.5}),glow=new THREE.MeshBasicMaterial({color:0xb4ed65});
  const foot=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,.2,6),metal);foot.position.y=.1;group.add(foot);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.11,.2,1.5,6),metal);shaft.position.y=.85;group.add(shaft);const core=new THREE.Mesh(new THREE.OctahedronGeometry(.38),glow);core.position.y=1.5;group.add(core);for(let i=0;i<4;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(1.8,.1,.18),metal);blade.position.y=.6+i*.2;blade.rotation.y=i*Math.PI/4;group.add(blade);}group.position.copy(player.position);scene.add(group);traps.push({mesh:group,t:0,pulse:0,life:55+level*15});while(traps.length>Math.min(5,level+1)){removeTrap(traps.shift());}fx.ring(group.position,3,0xb4ed65);audio.play('trap');ui.notify('Thorn engine planted · keep the crowd coming','info');}
const foundSecrets=new Set();
function interact(){if(legendary.near(player)){if(!legendary.interact())ui.notify(legendary.prompt(),'info');return;}if(defences.nearest(player.position)){setState('towers');return;}const shop=world.shops.find(s=>Math.hypot(s.x-player.position.x,s.z-player.position.z)<6);if(shop){setState('shop');return;}ui.notify('Find the amber forge to buy weapons and upgrades.','info');}
const slots=['fists','sword','axe','hammer','shotgun','repeater','gravehook','gravebreaker','eclipse','excalibur'];
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(['Space','Tab','ControlLeft','ControlRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'){defences.cancel();if(state==='playing')setState('pause');else if(state!=='title'&&state!=='death')setState('pause');return;}if(e.code==='Tab'&&state==='arsenal'){lockAndPlay();return;}if(state!=='playing')return;keys.add(e.code);if(e.repeat)return;if(e.code==='Tab'){setState('arsenal');return;}if(e.code==='KeyB'){setState('towers');return;}if(e.code==='Space')player.jump();if(e.code==='KeyQ')player.dash(keys);if(e.code==='ControlLeft'||e.code==='ControlRight')player.slide();if(e.code==='KeyR')reload();if(e.code==='KeyT')deployTrap();if(e.code==='KeyF'){const pad=!defences.pending&&defences.nearPurchase(player.position);if(pad){charging=false;charge=0;const result=defences.purchasePad(pad.id);ui.notify(result.message,result.ok?'unlock':'info');}else specialAttack();}if(e.code==='KeyE')interact();if(e.code.startsWith('Digit'))switchWeapon(slots[(Number(e.code.slice(5))+9)%10]);});
document.addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='KeyF'&&charging){if(charge>=.6)specialAttack();else{charging=false;charge=0;}}});
document.addEventListener('mousemove',e=>{if(state==='playing'&&document.pointerLockElement){lastLookX=e.movementX*.002;lastLookY=e.movementY*.002;player.look(e.movementX,e.movementY,progress.data.settings.sensitivity);}});
renderer.domElement.addEventListener('mousedown',e=>{if(state!=='playing')return;if(!document.pointerLockElement){renderer.domElement.requestPointerLock()?.catch(()=>{});return;}if(defences.pending){if(e.button===0){if(!defences.place())ui.notify('Placement blocked or not enough Shekkles.','info');}else if(e.button===2)defences.cancel();return;}if(e.button===0){mouseDown=true;attack();}if(e.button===2)attack(true);});
document.addEventListener('mouseup',()=>mouseDown=false);document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&state==='playing')setState('pause');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')setState('pause');progress.save();});
window.addEventListener('blur',()=>{keys.clear();mouseDown=false;});
renderer.domElement.addEventListener('wheel',e=>{if(state!=='playing')return;const owned=slots.filter(id=>progress.data.owned.includes(id));switchWeapon(owned[(owned.indexOf(weapon)+(e.deltaY>0?1:-1)+owned.length)%owned.length]);},{passive:true});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener('beforeunload',()=>progress.save());
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.04,(now-last)/1000);last=now;time+=dt;world.update?.(dt,time);
  scene.userData.playerX=player.position.x;scene.userData.playerZ=player.position.z;
  if(state==='playing'){
    attackTimer=Math.max(0,attackTimer-dt);quickTimer=Math.max(0,quickTimer-dt);trapCooldown=Math.max(0,trapCooldown-dt);
    specialCooldown=Math.max(0,specialCooldown-dt);if(charging)charge=Math.min(1,charge+dt);
    if(reloadTimer>0){reloadTimer-=dt;if(reloadTimer<=0){ammo[weapon]=magazine();audio.play('reload',.5);}}
    if(mouseDown)attack();
    const simDt=hitStop>0?dt*.18:dt;hitStop=Math.max(0,hitStop-dt);
    // Substeps make collisions reliable even after a long frame.
    const steps=Math.ceil(simDt/.012);for(let i=0;i<steps;i++)player.update(simDt/steps,keys);
    for(let i=pendingAttacks.length-1;i>=0;i--){pendingAttacks[i].delay-=dt;if(pendingAttacks[i].delay<=0){resolveAttack(pendingAttacks[i].id);pendingAttacks.splice(i,1);}}
    enemies.update(simDt,player,time,{kills:progress.data.kills,power:progress.data.owned.includes('cataclysm')?1:0});
    defences.aim(player);defences.update(simDt);arcana.update(simDt);
    if(legendary.near(player)&&Math.floor(time*2)%6===0)audio.play('wind',.5);
    for(let i=traps.length-1;i>=0;i--){const t=traps[i],level=progress.data.upgrades.trap;t.t+=simDt;t.pulse-=simDt;t.mesh.rotation.y+=simDt*3;if(t.pulse<=0){t.pulse=Math.max(.32,.85-level*.12);const radius=8+level*3;enemies.blast(t.mesh.position,radius,(75+level*35)*damageMultiplier(),12);fx.ring(t.mesh.position,radius,0xa9db67);}if(t.t>t.life){removeTrap(t);traps.splice(i,1);}}
    if(time-lastHurt>4)player.health=Math.min(100,player.health+dt*5);
    for(const secret of world.secrets){const id=secret.name;if(!(progress.data.secrets||[]).includes(id)&&!foundSecrets.has(id)&&Math.hypot(secret.x-player.position.x,secret.z-player.position.z)<2.5){foundSecrets.add(id);progress.data.secrets??=[];progress.data.secrets.push(id);progress.data.coins+=secret.reward||150;progress.data.totalEarned+=secret.reward||150;progress.save();ui.notify('Secret found · +'+(secret.reward||150)+' Shekkles','unlock');audio.play('buy');}}
    streakTimer-=dt;if(streakTimer<=0)streak=0;
    if(pendingVictory){pendingVictory=false;audio.play('victory');setState('victory');}
  }else if(!started){camera.position.set(15,8,24);camera.lookAt(-3,2,-5);}
  if(legendary.update(state==='playing'?dt:0,time,camera)){switchWeapon('excalibur');ui.notify('EXCALIBUR · THE OATH IS YOURS','unlock');}
  fx.update(dt);shake=Math.max(0,shake-dt);if(state==='playing'&&shake>0){const amount=shake*progress.data.settings.shake*.025;camera.rotation.z+=(Math.random()-.5)*amount;camera.position.y+=(Math.random()-.5)*amount;}
  view.update(dt,{speed:Math.hypot(player.velocity.x,player.velocity.z),grounded:player.grounded,sprinting:keys.has('ShiftLeft'),sliding:player.slideTime>0,time,lookX:lastLookX,lookY:lastLookY});lastLookX*=.6;lastLookY*=.6;audio.update?.(dt,state==='playing'?Math.hypot(player.velocity.x,player.velocity.z):0,player.grounded);
  renderer.render(scene,camera);if(started&&state!=='title')view.render?.(renderer);
  const purchasePad=!defences.pending&&defences.nearPurchase(player.position);
  const nearShop=world.shops.some(s=>Math.hypot(s.x-player.position.x,s.z-player.position.z)<6);
  ui.update({health:player.health,weapon:WEAPONS[weapon].name,weaponId:weapon,ammo:WEAPONS[weapon].ammo?ammo[weapon]:null,reserve:WEAPONS[weapon].ammo?'∞':null,kills:progress.data.kills,coins:progress.data.coins,zone:legendary.near(player)?'OATH HILL':world.zoneAt(player.position.x,player.position.z),dash:player.dashCooldown,trapCooldown,streak,alive:enemies.aliveCount,interactKey:purchasePad?'F':'E',interact:purchasePad?`Purchase ${purchasePad.type==='bolt'?'Turret':TOWER_TYPES[purchasePad.type].name} — ${TOWER_TYPES[purchasePad.type].cost.toLocaleString()} Shekkles`:legendary.near(player)?(progress.data.owned.includes('excalibur')?'Excalibur':progress.data.kills<20000?'Excalibur · '+progress.data.kills.toLocaleString()+' / 20,000':'Claim Excalibur'):nearShop?'Forge':defences.nearest(player.position)?'Tower':undefined,special:WEAPONS[weapon].special?`F · ${WEAPONS[weapon].special} · ${charging?Math.round(charge*100)+'%':specialCooldown>0?specialCooldown.toFixed(1)+'s':weapon==='excalibur'?'HOLD TO CHARGE':'READY'}`:'',placement:defences.pending?`${TOWER_TYPES[defences.pending].name} · ${defences.valid?'LMB place':'Blocked'} · RMB cancel`:null,charging,charge,reloading:reloadTimer>0});
  saveTimer+=dt;if(saveTimer>5){progress.save();saveTimer=0;}
}
requestAnimationFrame(frame);
// Explicitly development-only. Vite removes this branch in the production build.
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('test'))window.__MIREBREAK__={player,enemies,progress,world,fx,view,ammo,keys,arcana,defences,legendary,specialAttack,get charge(){return charge},get state(){return state},get weapon(){return weapon},attack,switchWeapon,reload,deployTrap,interact,setState,start:lockAndPlay,save:()=>progress.save(),get traps(){return traps},get renderer(){return renderer},testVictory(){progress.data.kills=149999;const e=enemies.spawn(player.position.x+2,player.position.z);if(e)enemies.blast(e.position,2,1e6,0);}};
