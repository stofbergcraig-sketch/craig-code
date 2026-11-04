import * as THREE from 'three';

// Combat values are intentionally shared with the HUD and the simulation.
export const WEAPONS = {
  fists: { name: 'BARE KNUCKLES', damage: 45, range: 3.2, cooldown: .32, force: 15, cosAngle: .50 },
  sword: { name: 'RUSTBITE', damage: 65, range: 4.8, cooldown: .36, force: 18, cosAngle: .15 },
  axe: { name: 'GRUDGE CLEAVER', damage: 110, range: 5.6, cooldown: .65, force: 25, cosAngle: -.05 },
  hammer: { name: 'BELLBREAKER', damage: 180, range: 8, cooldown: .95, force: 35, cosAngle: -.18 },
  shotgun: { name: 'GRAVELMOUTH', damage: 35, range: 60, cooldown: .65, force: 22, ammo: 8, reload: 1.5 },
  repeater: { name: 'THE ARGUMENT', damage: 90, range: 85, cooldown: .105, force: 14, ammo: 32, reload: 1.7 },
  gravehook:{name:'THE GRAVEHOOK',damage:105,range:5.8,cooldown:.3,force:16,cosAngle:.05,contact:.1,special:'Soul Hook',specialCooldown:2.5},
  gravebreaker:{name:'THE GRAVEBREAKER',damage:420,range:10,cooldown:1.05,force:44,cosAngle:-.2,contact:.28,special:'Earthbreaker',specialCooldown:7},
  eclipse:{name:'THE ECLIPSE SIGIL',damage:125,range:65,cooldown:.23,force:15,special:'Eclipse Burst',specialCooldown:5},
  excalibur:{name:'EXCALIBUR',damage:260,range:9,cooldown:.34,force:28,cosAngle:-.05,contact:.12,special:'Charged Soulwave',specialCooldown:3},
};

const mat = (color, roughness = .65, metalness = .15) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
const PALETTE = {
  iron: mat(0x738e91, .34, .7), lightIron: mat(0xb5c4b6, .35, .6), darkIron: mat(0x253b3c, .53, .6),
  edge: mat(0xdce5cf, .25, .7), gold: mat(0xb98d48, .42, .65), leather: mat(0x553b30, .8),
  wood: mat(0x92572f, .83), woodDark: mat(0x50382c, .85), glove: mat(0x48483a, .85),
  sleeve: mat(0x263b35, .95), skin: mat(0xae9573, .95), black: mat(0x101e20, .9),
  magic: new THREE.MeshStandardMaterial({ color: 0x9cf8cd, emissive: 0x55e7c4, emissiveIntensity: 1.6 }),
};

function box(parent, dimensions, position, material, rotation) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}
function cylinder(parent, top, bottom, length, position, material, radial = 8, rotation) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, length, radial), material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}
function rivet(parent, x, y, z, radius = .016) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), PALETTE.gold);
  m.position.set(x, y, z); parent.add(m); return m;
}
function prism(parent, points, depth, position, material) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(p => shape.lineTo(p[0], p[1]));
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .009, bevelSize: .012, bevelSegments: 1, steps: 1 });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); parent.add(mesh); return mesh;
}

function hand(parent, position, rotation = [0, 0, 0], forearm = true) {
  const g = new THREE.Group(); g.position.set(...position); g.rotation.set(...rotation); parent.add(g);
  box(g, [.14, .15, .17], [0, 0, 0], PALETTE.glove);
  box(g, [.15, .055, .18], [0, -.065, 0], PALETTE.leather);
  // Brass finger plates give the silhouette an unmistakable fist, even at low resolution.
  for (let i = 0; i < 4; i++) {
    box(g, [.033, .06, .07], [(i - 1.5) * .036, .055, -.065], PALETTE.gold);
    box(g, [.028, .057, .045], [(i - 1.5) * .036, .025, -.108], PALETTE.glove);
  }
  box(g, [.052, .09, .08], [-.082, -.01, -.015], PALETTE.glove, [0, .3, -.3]);
  if (forearm) {
    box(g, [.13, .29, .14], [0, -.2, .07], PALETTE.sleeve, [-.5, 0, 0]);
    box(g, [.145, .055, .15], [0, -.09, .014], PALETTE.iron);
    box(g, [.13, .04, .155], [0, -.145, .045], PALETTE.leather);
  }
  return g;
}

function meleeGrip(g, length = .52) {
  cylinder(g, .037, .045, length, [0, -.1, 0], PALETTE.wood, 8);
  for (let i = 0; i < 5; i++) cylinder(g, .046, .046, .028, [0, -.1 + i * .035, 0], PALETTE.leather, 8);
  cylinder(g, .06, .04, .07, [0, -.1 - length / 2, 0], PALETTE.gold, 8);
  hand(g, [0, -.075, .026]);
}

function buildFists() {
  const g = new THREE.Group();
  const right = hand(g, [.015, .035, -.05], [-.7, -.15, -.1]);
  const left = hand(g, [-.56, .015, -.1], [-.65, .15, .14]);
  return { group: g, right, left };
}
function buildSword() {
  const g = new THREE.Group(); meleeGrip(g, .30);
  box(g, [.37, .048, .09], [0, .14, 0], PALETTE.gold, [0, 0, .08]);
  box(g, [.08, .08, .09], [0, .16, 0], PALETTE.darkIron);
  prism(g, [[-.056, 0], [.055, 0], [.055, .60], [0, .78], [-.055, .60]], .034, [0, .19, 0], PALETTE.edge);
  prism(g, [[-.025, .03], [.024, .03], [.024, .58], [0, .71], [-.025, .58]], .04, [0, .19, .003], PALETTE.iron);
  for (let i = 0; i < 3; i++) box(g, [.013, .055, .008], [0, .32 + i * .10, .029], PALETTE.magic, [0, 0, .3]);
  rivet(g, -.13, .14, .052); rivet(g, .13, .16, .052);
  g.rotation.z = -.25; g.rotation.y = -.2;
  return { group: g };
}
function buildAxe() {
  const g = new THREE.Group(); meleeGrip(g, .87);
  cylinder(g, .054, .051, .4, [0, .31, 0], PALETTE.wood, 8);
  cylinder(g, .069, .069, .12, [0, .49, 0], PALETTE.gold, 8);
  prism(g, [[-.04, -.12], [-.25, -.24], [-.40, -.15], [-.43, .08], [-.29, .21], [-.04, .13]], .105, [0, .50, 0], PALETTE.iron);
  prism(g, [[-.30, -.21], [-.40, -.15], [-.43, .08], [-.33, .18], [-.31, .03]], .11, [0, .50, 0], PALETTE.edge);
  prism(g, [[.03, -.08], [.19, -.03], [.24, .09], [.03, .1]], .075, [0, .50, 0], PALETTE.darkIron);
  box(g, [.07, .22, .13], [0, .5, 0], PALETTE.gold);
  for (let i = 0; i < 3; i++) rivet(g, -.12 - i * .055, .49, .065, .014);
  box(g, [.04, .11, .014], [-.13, .58, .065], PALETTE.magic, [0, 0, -.5]);
  g.rotation.z = -.27; g.rotation.y = -.35;
  return { group: g };
}
function buildHammer() {
  const g = new THREE.Group(); meleeGrip(g, .82);
  cylinder(g, .051, .044, .46, [0, .26, 0], PALETTE.woodDark, 8);
  cylinder(g, .065, .065, .07, [0, .36, 0], PALETTE.gold, 8);
  box(g, [.52, .29, .30], [0, .53, 0], PALETTE.darkIron);
  box(g, [.36, .31, .32], [0, .53, 0], PALETTE.iron);
  box(g, [.07, .34, .34], [-.28, .53, 0], PALETTE.lightIron);
  box(g, [.07, .34, .34], [.28, .53, 0], PALETTE.lightIron);
  for (const x of [-.125, .125]) {
    box(g, [.035, .335, .35], [x, .53, 0], PALETTE.gold);
    box(g, [.016, .19, .012], [x, .53, .182], PALETTE.magic);
  }
  const plate = box(g, [.14, .14, .023], [0, .53, .173], PALETTE.gold, [0, 0, Math.PI / 4]);
  box(g, [.065, .065, .03], [0, .53, .19], PALETTE.magic, [0, 0, Math.PI / 4]);
  for (const x of [-.205, .205]) for (const y of [.44, .62]) rivet(g, x, y, .175);
  g.rotation.z = -.21; g.rotation.y = -.37;
  return { group: g, plate };
}

export function buildLegendarySword(){
  const model=buildSword();model.group.scale.set(1.18,1.2,1.18);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.17,.014,5,24),PALETTE.gold);halo.position.y=.2;model.group.add(halo);
  for(let i=0;i<6;i++)box(model.group,[.025,.04,.018],[(i%2?.045:-.045),.34+i*.08,.033],PALETTE.magic,[0,0,.7]);
  return model;
}
function buildHook(){
  const group=new THREE.Group();meleeGrip(group,.36);
  prism(group,[[0,0],[-.15,.14],[-.33,.17],[-.43,.06],[-.4,-.12],[-.27,-.24],[-.31,-.03],[-.18,.04],[0,-.05]],.065,[0,.45,0],PALETTE.darkIron);
  for(let i=0;i<4;i++)box(group,[.02,.045,.075],[-.12-i*.065,.52,.005],PALETTE.magic,[0,0,-.4]);
  for(let i=0;i<8;i++){const link=new THREE.Mesh(new THREE.TorusGeometry(.035,.009,4,8),PALETTE.iron);link.position.set(.04+Math.sin(i*.4)*.05,-.25-i*.045,.02);link.rotation.y=i%2*Math.PI/2;group.add(link);}
  return {group};
}
function buildGravebreaker(){const m=buildHammer();m.group.scale.setScalar(1.18);for(const x of [-.3,.3]){const spike=new THREE.Mesh(new THREE.ConeGeometry(.07,.25,4),PALETTE.black);spike.position.set(x,.78,0);m.group.add(spike);}for(let i=0;i<5;i++)box(m.group,[.018,.18,.012],[-.18+i*.09,.54,.19],PALETTE.magic,[0,0,(i%2?1:-1)*.55]);return m;}
function buildSigil(){const group=new THREE.Group();hand(group,[0,0,0],[-.5,0,0]);box(group,[.19,.18,.12],[0,.02,-.11],PALETTE.darkIron);const rings=[];for(let i=0;i<3;i++){const ring=new THREE.Group();ring.position.set(-.04,.16,-.23-i*.09);const hoop=new THREE.Mesh(new THREE.TorusGeometry(.15+i*.035,.008,5,32),i===1?PALETTE.gold:PALETTE.magic);ring.add(hoop);for(let j=0;j<8;j++)box(ring,[.015,.045,.012],[Math.cos(j*Math.PI/4)*(.15+i*.035),Math.sin(j*Math.PI/4)*(.15+i*.035),0],PALETTE.gold,[0,0,j*Math.PI/4]);group.add(ring);rings.push(ring);}return {group,rings};}

function buildGun(repeater) {
  const g = new THREE.Group();
  // The construction follows a visible receiver, working action, grip and barrel.
  box(g, [.16, .15, .34], [0, .035, -.015], PALETTE.darkIron);
  box(g, [.135, .13, .30], [0, .04, .18], PALETTE.wood, [-.10, 0, 0]);
  box(g, [.18, .16, .04], [0, .023, .35], PALETTE.leather);
  box(g, [.105, .19, .1], [0, -.11, .09], PALETTE.wood, [-.25, 0, 0]);
  hand(g, [.012, -.15, .085], [.5, -.05, 0]);
  box(g, [.18, .04, .17], [0, .122, -.04], PALETTE.iron);
  box(g, [.035, .068, .045], [0, .165, .015], PALETTE.darkIron);
  box(g, [.018, .015, .018], [0, .193, .01], PALETTE.magic);
  box(g, [.01, .055, .12], [.087, .03, -.01], PALETTE.gold);
  for (const z of [-.08, .055]) rivet(g, .095, .058, z, .014);
  let pump, magazine;
  if (!repeater) {
    for (const x of [-.041, .041]) {
      cylinder(g, .036, .038, .61, [x, .06, -.44], PALETTE.iron, 10, [Math.PI / 2, 0, 0]);
      cylinder(g, .04, .04, .045, [x, .06, -.75], PALETTE.gold, 10, [Math.PI / 2, 0, 0]);
      cylinder(g, .029, .029, .047, [x, .06, -.774], PALETTE.black, 10, [Math.PI / 2, 0, 0]);
    }
    pump = new THREE.Group(); pump.position.set(0, -.005, -.40); g.add(pump);
    box(pump, [.17, .12, .22], [0, 0, 0], PALETTE.wood);
    for (let i = 0; i < 6; i++) box(pump, [.177, .125, .012], [0, 0, -.09 + i * .034], PALETTE.woodDark);
    cylinder(g, .025, .025, .42, [0, -.04, -.36], PALETTE.darkIron, 8, [Math.PI / 2, 0, 0]);
    box(g, [.025, .056, .03], [0, .115, -.68], PALETTE.gold);
  } else {
    cylinder(g, .04, .044, .69, [0, .07, -.46], PALETTE.darkIron, 10, [Math.PI / 2, 0, 0]);
    cylinder(g, .075, .075, .09, [0, .07, -.78], PALETTE.gold, 8, [Math.PI / 2, 0, 0]);
    cylinder(g, .038, .038, .098, [0, .07, -.8], PALETTE.black, 8, [Math.PI / 2, 0, 0]);
    box(g, [.14, .13, .34], [0, .01, -.37], PALETTE.woodDark);
    for (let i = 0; i < 5; i++) box(g, [.15, .018, .025], [0, .08, -.25 - i * .055], PALETTE.gold);
    magazine = cylinder(g, .13, .13, .115, [0, -.135, -.10], PALETTE.darkIron, 12, [0, 0, Math.PI / 2]);
    for (const x of [-.07, .07]) cylinder(g, .11, .11, .025, [x, -.135, -.10], PALETTE.gold, 12, [0, 0, Math.PI / 2]);
    box(g, [.03, .06, .035], [0, .14, -.64], PALETTE.iron);
    box(g, [.015, .018, .015], [0, .175, -.64], PALETTE.magic);
  }
  const left = hand(g, [-.06, -.12, -.35], [-.3, .15, -.2]);
  const shell = new THREE.Group(); shell.visible = false; g.add(shell);
  cylinder(shell, .025, .025, .09, [0, 0, 0], PALETTE.gold, 8, [Math.PI / 2, 0, 0]);
  cylinder(shell, .026, .026, .055, [0, 0, -.03], mat(0xb95439), 8, [Math.PI / 2, 0, 0]);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, .06, repeater ? -.86 : -.8); g.add(muzzle);
  const flash = new THREE.Group(); muzzle.add(flash);
  const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffd597, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false });
  const flare = new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 5), flashMaterial);
  flare.rotation.x = -Math.PI / 2; flare.position.z = -.15; flash.add(flare);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.085, 0), new THREE.MeshBasicMaterial({ color: 0xffffdb }));
  flash.add(core); flash.visible = false;
  return { group: g, pump, magazine, left, shell, muzzle, flash };
}

/** A separately lit foreground pass avoids clipping the weapon through scenery. */
export class WeaponView {
  constructor(camera) {
    this.worldCamera = camera;
    this.scene = new THREE.Scene();
    this.viewCamera = new THREE.PerspectiveCamera(70, camera.aspect, .01, 10);
    this.scene.add(new THREE.HemisphereLight(0xe3f9e7, 0x667777, 2.2));
    const light = new THREE.DirectionalLight(0xffd8a3, 3.2); light.position.set(-2, 4, 4); this.scene.add(light);
    const rim = new THREE.DirectionalLight(0x70e8ce, 1.8); rim.position.set(2, 1, -3); this.scene.add(rim);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.models = { fists: buildFists(), sword: buildSword(), axe: buildAxe(), hammer: buildHammer(), shotgun: buildGun(false), repeater: buildGun(true),gravehook:buildHook(),gravebreaker:buildGravebreaker(),eclipse:buildSigil(),excalibur:buildLegendarySword() };
    for (const model of Object.values(this.models)) { this.root.add(model.group); model.group.visible = false; }
    this.id = 'fists'; this.age = 10; this.switchAge = 1; this.reloadAge = 0; this.reloadDuration = 0; this.recoil = 0; this.alternate = false;
    this.bobPhase = 0; this.sway = new THREE.Vector2(); this.setWeapon('fists');
  }
  setWeapon(id) {
    if (!this.models[id]) return;
    for (const [name, model] of Object.entries(this.models)) model.group.visible = name === id;
    this.id = id; this.age = 10; this.switchAge = 0; this.reloadDuration = 0; this.recoil = 0;
  }
  attack() {
    this.age = 0; this.recoil = this.id === 'shotgun' ? 1 : this.id === 'repeater' ? .44 : 0;
    this.alternate = !this.alternate;
    this.combo=((this.combo||0)+1)%3;
  }
  special(){this.specialAge=0;this.attack();this.recoil=1;}
  thumbnails(){
    const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});renderer.setSize(240,140);renderer.outputColorSpace=THREE.SRGBColorSpace;
    const saved=this.id,images={};const position=this.root.position.clone(),rotation=this.root.rotation.clone();const camera=new THREE.PerspectiveCamera(46,240/140,.01,10);camera.position.set(0,.1,2.3);camera.lookAt(0,.1,0);
    for(const id of Object.keys(this.models)){this.setWeapon(id);this.root.position.set(0,-.2,0);this.root.rotation.set(0,-.35,-.3);renderer.render(this.scene,camera);images[id]=renderer.domElement.toDataURL();}
    this.setWeapon(saved);this.root.position.copy(position);this.root.rotation.copy(rotation);renderer.dispose();return images;
  }
  reload(duration = 1.5) { this.reloadAge = 0; this.reloadDuration = duration; }
  update(dt, state = {}) {
    const { speed = 0, grounded = true, sprinting = false, sliding = false, time = 0, lookX = 0, lookY = 0 } = state;
    this.age += dt; this.switchAge += dt; this.reloadAge += dt;
    this.specialAge=(this.specialAge??10)+dt;
    this.recoil = THREE.MathUtils.damp(this.recoil, 0, 14, dt);
    this.bobPhase += dt * (grounded ? Math.min(speed, 20) * .75 : 1.5);
    const bob = grounded ? Math.min(speed / 15, 1) : .1;
    const gun = this.id === 'shotgun' || this.id === 'repeater';
    const baseX = gun ? .28 : .34;
    this.sway.x = THREE.MathUtils.damp(this.sway.x, THREE.MathUtils.clamp(lookX, -.08, .08), 8, dt);
    this.sway.y = THREE.MathUtils.damp(this.sway.y, THREE.MathUtils.clamp(lookY, -.05, .05), 8, dt);
    this.root.position.set(baseX + Math.sin(this.bobPhase) * .015 * bob - this.sway.x, -.34 + Math.cos(this.bobPhase * 2) * .012 * bob - this.sway.y, -.58);
    this.root.rotation.set(.015 * Math.cos(time * 1.8), 0, .015 * Math.sin(time * 1.4));
    if (sliding) { this.root.position.y -= .06; this.root.rotation.z -= .12; }
    if (sprinting && speed > 5) { this.root.position.y -= .055+Math.abs(Math.sin(this.bobPhase))*.025; this.root.rotation.z += .14;this.root.rotation.x+=Math.cos(this.bobPhase)*.025; }
    this.root.position.y -= Math.max(0, 1 - this.switchAge / .2) ** 2 * .42;
    const current = this.models[this.id];
    if (gun) {
      this.root.position.z += this.recoil * .14;
      this.root.rotation.x += this.recoil * .13;
      this.root.rotation.z -= this.recoil * .035;
      current.flash.visible = this.age < (this.id === 'shotgun' ? .065 : .037);
      current.flash.rotation.z = Math.sin(time * 80) * 2;
      current.flash.scale.setScalar(this.id === 'shotgun' ? 1 : .55);
      if (current.pump) current.pump.position.z = -.40 + Math.sin(Math.min(1, Math.max(0, (this.age - .10) / .3)) * Math.PI) * .10;
      const reloading = this.reloadDuration > 0 && this.reloadAge < this.reloadDuration;
      current.shell.visible = reloading;
      current.left.position.set(-.06, -.12, -.35);
      if (current.magazine) current.magazine.position.y = -.135;
      if (reloading) {
        const progress = this.reloadAge / this.reloadDuration;
        const ease = Math.sin(Math.PI * progress) ** .65;
        this.root.rotation.z += ease * .63;
        this.root.rotation.y += ease * .2;
        this.root.position.y -= ease * .12;
        this.root.position.z += ease * .13;
        const cycle = (progress * (this.id === 'shotgun' ? 3 : 1)) % 1;
        current.left.position.set(-.13 - Math.sin(cycle * Math.PI) * .13, -.14 - Math.sin(cycle * Math.PI) * .12, -.12);
        current.shell.position.set(-.13 + cycle * .13, -.12 + cycle * .10, -.08);
        current.shell.rotation.x = cycle * .8;
        if (current.magazine) current.magazine.position.y -= Math.sin(progress * Math.PI) * .19;
      }
    } else if(this.id==='eclipse'){
      current.rings.forEach((ring,i)=>{ring.rotation.z=time*(i%2?-1:1)*(1+i*.4);ring.rotation.y=Math.sin(time+i)*.16;ring.scale.setScalar(1+Math.max(0,1-this.specialAge/.6)*.45);});this.root.position.z+=Math.sin(Math.min(1,this.age/.23)*Math.PI)*.1;
    } else {
      const duration = { fists: .27, sword: .30, axe: .53, hammer: .68,gravehook:.27,gravebreaker:.8,excalibur:.3 }[this.id];
      const progress = Math.min(1, this.age / duration);
      const swing = Math.sin(progress * Math.PI) ** .75;
      if (this.id === 'fists') {
        for (const side of ['left', 'right']) {
          const fist = current[side]; fist.position.z = side === 'left' ? -.1 : -.05;
          fist.position.y = side === 'left' ? .015 : .035;
        }
        const fist = this.alternate ? current.right : current.left;
        fist.position.z -= swing * .35; fist.position.y += swing * .13;
        this.root.position.x += swing * (this.alternate ? -.1 : .1);
      } else {
        const heavy = ['hammer','gravebreaker','axe'].includes(this.id),sign=this.combo===1?-1:1;
        // Wind-up, fast contact at ~40%, and follow-through are separate phases.
        const wind=progress<.25?Math.sin(progress/.25*Math.PI):0;
        const slash=progress<.25?0:Math.sin((progress-.25)/.75*Math.PI);
        const thrust=!heavy&&this.combo===2;
        this.root.rotation.z+=wind*-.22*sign+slash*(heavy?.9:1.5)*sign;
        this.root.rotation.x+=wind*.2-slash*(heavy&&this.combo===2?1.45:.55);
        this.root.rotation.y+=slash*(thrust?-.1:-.6)*sign;
        this.root.position.x-=slash*(thrust?.1:heavy?.32:.48)*sign;
        this.root.position.y+=slash*(heavy?-.12:.06);
        this.root.position.z-=slash*(thrust?.42:.14);
      }
    }
  }
  muzzlePosition() {
    const muzzle = this.models[this.id].muzzle;
    if (muzzle) { this.scene.updateMatrixWorld(true); return muzzle.getWorldPosition(new THREE.Vector3()).applyQuaternion(this.worldCamera.quaternion).add(this.worldCamera.position); }
    return new THREE.Vector3(.25, -.25, -.8).applyQuaternion(this.worldCamera.quaternion).add(this.worldCamera.position);
  }
  render(renderer) {
    if (this.viewCamera.aspect !== this.worldCamera.aspect) { this.viewCamera.aspect = this.worldCamera.aspect; this.viewCamera.updateProjectionMatrix(); }
    const autoClear = renderer.autoClear; renderer.autoClear = false;
    renderer.clearDepth(); renderer.render(this.scene, this.viewCamera); renderer.autoClear = autoClear;
  }
}
