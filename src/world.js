import * as THREE from 'three';

// Everything in Mirebreak is built here from original geometry and pixel textures.
// Collision coordinates describe solid boxes, with y measured from the ground.
export function createWorld(scene) {
  const colliders = [], spawnPoints = [], barrels = [], animated = [];
  const shops = [{ x: -7, z: 5, name: 'THE CROOKED ANVIL' }];
  const secrets = [
    { x: -78, z: -38, name: 'The gravedigger’s rainy-day fund', reward: 300 },
    { x: 77, z: 47, name: 'The chief’s extremely secret savings', reward: 450 },
    { x: 0, z: -89, name: 'The old king’s loose change', reward: 700 },
  ];
  let seed = 519381;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const range = (a, b) => a + random() * (b - a);
  const choose = a => a[Math.floor(random() * a.length)];

  function texture(kind, base, flecks) {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d');
    c.fillStyle = base; c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1500; i++) {
      c.fillStyle = choose(flecks); const s = choose([1, 2, 3, 4]);
      c.fillRect(Math.floor(random() * 128), Math.floor(random() * 128), s, s);
    }
    if (kind === 'stone') {
      c.strokeStyle = '#222e33'; c.lineWidth = 3;
      for (let row = 0; row < 4; row++) {
        c.beginPath(); c.moveTo(0, row * 32); c.lineTo(128, row * 32); c.stroke();
        for (let col = 0; col < 4; col++) {
          const x = col * 48 + (row % 2) * 24;
          c.beginPath(); c.moveTo(x, row * 32); c.lineTo(x, row * 32 + 32); c.stroke();
        }
      }
    }
    if (kind === 'wood') {
      for (let i = 0; i < 20; i++) { c.fillStyle = choose(['#292725','#6b5340','#3d372f']); c.fillRect(Math.floor(random() * 128), 0, 1 + random() * 2, 128); }
    }
    const t = new THREE.CanvasTexture(canvas); t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapLinearFilter; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const stoneMap = texture('stone', '#687477', ['#748182','#596b6c','#89908b','#4d5e61']);
  const woodMap = texture('wood', '#675441', ['#755e45','#544638','#8e7553']);
  const mudMap = texture('mud', '#394a40', ['#3e5142','#4c5747','#303e39','#58604a']); mudMap.repeat.set(60, 60);
  const pathMap = texture('mud', '#5d6151', ['#73725b','#696958','#4f594e','#81816a']); pathMap.repeat.set(8, 4);
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.95, ...extra });
  const materials = {
    stone: mat(0xa9b6af, { map: stoneMap }), darkStone: mat(0x657c78, { map: stoneMap }),
    paleStone: mat(0xb6b5a1, { map: stoneMap }), wood: mat(0xb5a18a, { map: woodMap }),
    darkWood: mat(0x766858, { map: woodMap }), bark: mat(0x343b37), moss: mat(0x405f4b),
    foliage: mat(0x243e3b), foliage2: mat(0x304d42), grass: mat(0x627451),
    metal: mat(0x454d50, { metalness: 0.6, roughness: 0.45 }), bronze: mat(0xb08e4f, { metalness: 0.5 }),
    orange: mat(0xffd483, { emissive: 0xff9c30, emissiveIntensity: 1.6 }),
    cyan: mat(0x87e8b0, { emissive: 0x50bba5, emissiveIntensity: 1.3 }),
    purple: mat(0xa9a2da, { emissive: 0x685b9c, emissiveIntensity: 0.35 }),
    cloth: mat(0x854333, { side: THREE.DoubleSide }), clothDark: mat(0x344b53, { side: THREE.DoubleSide }),
    roof: mat(0x334c50), red: mat(0x8e4430), bone: mat(0xb8b19a), black: mat(0x1d292a),
  };
  const geometry = {
    box: new THREE.BoxGeometry(1, 1, 1), cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 7),
    cone: new THREE.ConeGeometry(0.5, 1, 6), rock: new THREE.DodecahedronGeometry(0.5, 0),
    sphere: new THREE.IcosahedronGeometry(0.5, 1), plane: new THREE.PlaneGeometry(1, 1),
  };
  // A cracked green moon gives the skyline a recognisable original silhouette.
  const moonCanvas = document.createElement('canvas'); moonCanvas.width = moonCanvas.height = 256;
  const moonContext = moonCanvas.getContext('2d');
  const moonGradient = moonContext.createRadialGradient(104, 90, 3, 128, 128, 116);
  moonGradient.addColorStop(0, '#dae5bb'); moonGradient.addColorStop(0.65, '#a5c7ac'); moonGradient.addColorStop(1, '#608c86');
  moonContext.fillStyle = moonGradient; moonContext.beginPath(); moonContext.arc(128,128,112,0,Math.PI*2); moonContext.fill();
  for(let i=0;i<38;i++) {
    const x=range(40,216),y=range(40,216),radius=range(3,17);
    if(Math.hypot(x-128,y-128)+radius>108)continue;
    moonContext.fillStyle='rgba(46,87,76,0.17)';moonContext.beginPath();moonContext.arc(x,y,radius,0,Math.PI*2);moonContext.fill();
  }
  moonContext.strokeStyle='#42685f';moonContext.lineWidth=5;moonContext.beginPath();moonContext.moveTo(153,17);moonContext.lineTo(136,69);moonContext.lineTo(157,105);moonContext.lineTo(116,145);moonContext.lineTo(126,184);moonContext.lineTo(97,235);moonContext.stroke();
  moonContext.lineWidth=2;moonContext.beginPath();moonContext.moveTo(157,105);moonContext.lineTo(192,119);moonContext.lineTo(223,102);moonContext.moveTo(116,145);moonContext.lineTo(77,135);moonContext.lineTo(35,157);moonContext.stroke();
  const moonMap=new THREE.CanvasTexture(moonCanvas);moonMap.colorSpace=THREE.SRGBColorSpace;
  const moon=new THREE.Mesh(new THREE.PlaneGeometry(29,29),new THREE.MeshBasicMaterial({map:moonMap,transparent:true,depthWrite:false,fog:false,color:0x97b5a8}));
  moon.position.set(-48,65,-142);moon.lookAt(0,0,0);scene.add(moon);
  const buckets = new Map(), dummy = new THREE.Object3D();
  function put(type, material, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const key = `${type}:${material}`;
    if (!buckets.has(key)) buckets.set(key, []);
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rx, ry, rz); dummy.updateMatrix();
    buckets.get(key).push(dummy.matrix.clone());
  }
  function solid(x, z, w, d, h, material = 'stone', y = 0) {
    put('box', material, x, y + h / 2, z, w, h, d);
    colliders.push({ x, z, w, d, h, y });
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(224, 224), mat(0xabb9a1, { map: mudMap }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  function floor(x, z, w, d, color = 0xa7a593) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, { map: pathMap }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, 0.012 + random() * 0.004, z); mesh.receiveShadow = true; scene.add(mesh);
  }
  floor(0, 7, 43, 48); floor(0, -37, 13, 44); floor(-45, 7, 57, 11, 0x969d8b);
  floor(46, 9, 57, 12, 0x9c927a); floor(-58, -12, 38, 45, 0x84968a);
  floor(57, 13, 48, 53, 0x9d8f77); floor(0, -73, 48, 42, 0x8f9f9b);
  floor(0, 57, 13, 54, 0x9e9c83);

  function torch(x, z, height = 3, cyan = false) {
    put('box', 'darkWood', x, height / 2, z, 0.24, height, 0.24);
    put('box', 'metal', x, height - 0.15, z, 0.65, 0.15, 0.65);
    put('cone', cyan ? 'cyan' : 'orange', x, height + 0.3, z, 0.55, 0.85, 0.55);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ color: cyan ? 0x49d9ad : 0xffa54c, map: glowTexture(), transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(x, height + 0.2, z); scene.add(glow); animated.push({ type: 'glow', mesh: glow, phase: random() * 6 });
  }
  let cachedGlow;
  function glowTexture() {
    if (cachedGlow) return cachedGlow;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const c = canvas.getContext('2d'), g = c.createRadialGradient(16,16,0,16,16,16);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.18, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0,0,32,32); cachedGlow = new THREE.CanvasTexture(canvas); return cachedGlow;
  }
  function label(text, x, y, z, width, color = '#eed9a3', rotation = 0) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
    const c = canvas.getContext('2d'); c.fillStyle = '#1c2929'; c.fillRect(0,0,1024,128);
    c.strokeStyle = '#937b4a'; c.lineWidth = 5; c.strokeRect(6,6,1012,116);
    c.font = 'bold 64px Georgia'; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 512, 66, 970);
    const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, width / 8), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
    mesh.position.set(x,y,z); mesh.rotation.y = rotation; scene.add(mesh);
  }
  function wall(x, z, w, d, h = 4) {
    solid(x,z,w,d,h); put('box','moss',x,h+0.08,z,w+0.2,0.15,d+0.2);
    const alongX = w > d, length = alongX ? w : d;
    for (let i = -length/2+0.6; i < length/2; i += 2.8) put('box','paleStone',x+(alongX?i:0),h+0.55,z+(alongX?0:i),alongX?1.1:d+0.15,1.1,alongX?d+0.15:1.1);
  }
  function arch(x,z,width = 9,height = 8,rotation = 0) {
    if (!rotation) { solid(x-width/2-1,z,2.2,3,height); solid(x+width/2+1,z,2.2,3,height); solid(x,z,width,3,2,'stone',height-1.3); }
    else { solid(x,z-width/2-1,3,2.2,height); solid(x,z+width/2+1,3,2.2,height); solid(x,z,3,width,2,'stone',height-1.3); }
    for (const side of [-1,1]) {
      const px = x+(rotation?0:side*(width/2+1)), pz = z+(rotation?side*(width/2+1):0);
      put('cone','roof',px,height+2,pz,3.5,4,3.5,0,Math.PI/4);
      torch(px+(rotation?1.7:0), pz+(rotation?0:1.7),4.1);
    }
  }
  // The debtor's courtyard: deliberately broad lanes and waist-high broken walls.
  wall(-15, -16, 12, 2, 3.2); wall(15, -16, 12, 2, 4.2);
  wall(-22, -8, 2, 14, 3); wall(-22, 23, 2, 16, 3.7);
  wall(22, -8, 2, 14, 3.5); wall(22, 25, 2, 12, 2.3);
  wall(-15,31,12,2,2.5); wall(15,31,12,2,2.8);
  arch(0,-16,10,7.2); arch(0,33,10,6.5);
  label('M I R E B R E A K',0,7.2,-14.4,10);
  label('THE HOLLOW KEEP',0,4.8,-14.3,6);
  // Broken central monument, off the player's opening sightline.
  solid(11,11,4.3,4.3,0.45,'darkStone'); solid(11,11,2.7,2.7,1.3,'stone',0.45);
  put('cylinder','paleStone',11,3.1,11,1.5,3,1.5); put('rock','paleStone',11,4.7,11,2.4,2.7,2.4,0,0.4,0.3);
  put('box','bronze',11,6.25,11,2.5,0.25,0.4,0,0,-0.24);
  for (let i=0;i<16;i++) put('rock','darkStone',11+range(-5,5),0.2,11+range(-5,5),range(0.2,0.7),range(0.2,0.5),range(0.3,0.7),random(),random(),random());

  // Warm, unmistakable upgrade shop. Player can walk right up to the anvil.
  for (const x of [-10,-4]) for (const z of [2,7]) solid(x,z,0.35,0.35,4.6,'darkWood');
  put('box','cloth',-7,4.5,4.5,7.3,0.22,6.5,0,0,-0.08);
  put('box','wood',-7,1,2.5,4.8,0.4,1.4); put('box','metal',-7,1.5,3,1.5,0.6,0.7);
  put('cone','metal',-6.2,1.6,3,0.55,1.1,0.65,0,0,-Math.PI/2);
  put('cylinder','bronze',-8.5,1.5,3,0.45,0.55,0.45);
  label('THE CROOKED ANVIL',-7,3.85,7.1,6);
  label('E  /  WEAPONS + UPGRADES',-7,2.95,7.12,5,'#f6c86b');
  torch(-10.6,7,3); torch(-3.4,7,3);
  const shopLight = new THREE.PointLight(0xffb455,20,18,1.6); shopLight.position.set(-7,3.5,5); scene.add(shopLight);
  const shopRing = new THREE.Mesh(new THREE.RingGeometry(2.5,2.58,48),new THREE.MeshBasicMaterial({color:0xd1ab61,side:THREE.DoubleSide,transparent:true,opacity:0.8}));
  shopRing.rotation.x=-Math.PI/2; shopRing.position.set(-7,0.035,5); scene.add(shopRing);

  function tree(x,z,scale=1,dead=false) {
    const h=range(8,13)*scale;
    put('cylinder','bark',x,h/2,z,0.85*scale,h,0.85*scale,0,0,range(-0.04,0.04));
    if (scale>0.8) colliders.push({x,z,w:0.9*scale,d:0.9*scale,h});
    for(let i=0;i<3;i++) {
      const a=i*2.1+random(),len=range(2,4)*scale;
      put('cylinder','bark',x+Math.sin(a)*len*0.35,h*(0.5+i*0.12),z+Math.cos(a)*len*0.35,0.3*scale,len,0.3*scale,Math.cos(a)*0.9,0,Math.sin(a)*0.9);
    }
    if(!dead) for(let i=0;i<3;i++) put('cone',i===1?'foliage2':'foliage',x,h*(0.68+i*0.14),z,(6-i*1.3)*scale,h*0.52,(6-i*1.3)*scale,0,random());
  }
  // Gravewood has crooked trees, old grave rows, tall fungal lanterns, and a crypt.
  for(let i=0;i<36;i++) {
    const x=range(-94,-30),z=range(-58,44);
    if(Math.abs(z-7)<8 || (x < -69 && z < -29 && z > -47)) continue;
    tree(x,z,range(0.8,1.5),i%4===0);
  }
  for(let row=0;row<4;row++) for(let col=0;col<4;col++) {
    const x=-69+col*5.2,z=-18+row*7;
    if(row===3)continue;
    put('box','darkStone',x,0.055,z,2.2,0.1,3.2);
    put('box','paleStone',x,0.75,z-1.4,0.9,1.5,0.35,0,range(-0.15,0.15),range(-0.13,0.13));
    put('box','paleStone',x,1.05,z-1.4,1.45,0.22,0.4);
  }
  solid(-78,-44,11,2,5,'darkStone'); solid(-84,-40,2,8,5,'darkStone'); solid(-72,-42,2,4,5,'darkStone');
  put('box','roof',-78,-0.2,-40,14,0.3,12); label('GRAVEWOOD',-37,4.5,6,6,'#a8d7c0',Math.PI/2);
  torch(-37,1,3,true); torch(-37,13,3,true);
  for(let i=0;i<24;i++) {
    const x=range(-87,-35),z=range(-38,33),s=range(0.35,0.95);
    put('cylinder','bone',x,s*0.5,z,s*0.18,s,s*0.18); put('sphere','purple',x,s,z,s*1.4,s*0.45,s*1.4);
    put('sphere','cyan',x+s*0.3,s*1.12,z,s*0.18,s*0.08,s*0.18);
  }

  function hut(x,z,w,d,h,orientation=0) {
    // Three sides, with a broad front opening. Roof is decoration above head height.
    solid(x-w/2,z,0.5,d,h,'darkWood'); solid(x+w/2,z,0.5,d,h,'darkWood');
    solid(x,z-d/2,w,0.45,h,'wood');
    put('box','roof',x-w*0.25,h+0.75,z,w*0.63,0.25,d+1.3,0,0,0.4);
    put('box','roof',x+w*0.25,h+0.75,z,w*0.63,0.25,d+1.3,0,0,-0.4);
    for(let i=0;i<3;i++)put('box','cloth',x-w/2+i*w/2,h+0.15,z+d/2+0.1,w/3,0.7,0.04,0,0,range(-0.1,0.1));
    torch(x-w/2-0.8,z+d/2,2.8);
  }
  hut(46,-7,9,9,4.2); hut(70,-7,10,10,5); hut(46,34,8,9,3.5); hut(70,35,10,9,4);
  // Goblin chief's raised banner mast and central bonfire, easily skirted.
  solid(58,14,0.7,0.7,11,'wood');
  put('box','cloth',60,8.6,14,4,3,0.1); put('cone','bone',58,11.5,14,1,1.4,1);
  put('sphere','bone',60,8.9,14.1,1.3,1.4,0.3);
  put('box','black',59.7,9,14.28,0.25,0.3,0.1);put('box','black',60.3,9,14.28,0.25,0.3,0.1);
  put('box','black',60,8.5,14.28,0.65,0.14,0.1);
  put('cylinder','darkStone',58,0.15,23,4,0.3,4); put('cone','orange',58,1.2,23,1.5,2.7,1.5);
  for(let i=0;i<6;i++)put('cylinder','darkWood',58,0.35,23,0.35,3,0.35,Math.PI/2,Math.PI*i/3);
  label('THE SPLINTER CAMP',34,4.5,9,7,'#f3bb83',-Math.PI/2);
  const fireLight=new THREE.PointLight(0xff913b,15,18,1.5);fireLight.position.set(58,3,23);scene.add(fireLight);
  animated.push({type:'light',light:fireLight});
  // Broken camp perimeter; gaps keep it from becoming an AI navigation trap.
  for(const x of [37,82]) for(const z of [-15,1,31,43]) {
    put('box','wood',x,2,z,0.4,4,4.8);
    for(let j=-2;j<=2;j++)put('cone','wood',x,4.2,z+j,0.5,1.1,0.5);
  }

  // A pair of leaning black towers anchors the skyline from every district.
  for(const x of [-18,18]) {
    solid(x,-71,9,11,19,'darkStone');
    put('box','paleStone',x,18.5,-71,10.2,1,12.2);
    put('cone','roof',x,24.2,-71,13,11,13,0,Math.PI/4);
    put('cone','bronze',x,30,-71,0.5,4,0.5,0,0,x>0?-0.14:0.14);
    for(const y of [6,11,16])put('box','cyan',x,y,-65.44,0.65,2.2,0.1);
    for(let i=-1;i<=1;i++)put('box','paleStone',x+i*3.5,19.6,-65.5,1.2,1.3,1.3);
  }
  arch(0,-58,13,12);
  wall(-23,-89,2,32,6);wall(23,-89,2,32,7);wall(-15,-101,14,2,8);wall(15,-101,14,2,7);
  label('THE HOLLOW KEEP',0,9.8,-56.4,11);
  for(let i=0;i<8;i++) {
    const x=(i%2?1:-1)*10.5,z=-69-Math.floor(i/2)*8;
    solid(x,z,1.3,1.3,range(4,7),'paleStone');
    put('cone','cyan',x,3,z+0.75,0.35,0.7,0.35);
  }
  // Back courtyard altar: low steps are actually traversable collision surfaces.
  for(let i=0;i<3;i++)solid(0,-95+i*0.7,9-i*1.8,5-i*0.7,0.35,'stone',i*0.35);
  put('box','darkStone',0,1.7,-96,3.8,1.3,1.7);put('sphere','cyan',0,3.3,-96,1.6,2.2,1.6);
  const altarLight=new THREE.PointLight(0x71f0c0,12,20,1.5);altarLight.position.set(0,4,-96);scene.add(altarLight);
  for(const x of [-6,6])torch(x,-48,3.6,true);
  for(const x of [-6,6])torch(x,-34,3.6,true);
  // Southern marsh promenade gives a long run-up and a view back onto the keep.
  for(let i=0;i<8;i++) {
    const z=45+i*5;
    put('box','wood',0,0.025,z,9,0.05,3.7);
    for(const x of [-5.5,5.5])put('box','darkWood',x,0.7,z,0.35,1.4,0.35);
  }
  arch(0,85,9,6);
  label('NO REFUNDS',0,5.3,83.4,6,'#c4b998',Math.PI);
  for(let i=0;i<12;i++)tree(choose([-1,1])*range(25,90),range(52,92),range(0.8,1.2),i%3===0);

  // A few readable cover objects. Decorative rubble never creates ankle traps.
  for(const [x,z] of [[-15,17],[17,23],[-12,-7],[13,-39],[-46,24],[78,18],[41,18],[-8,-79]]) {
    solid(x,z,2.1,2.1,1.7,'wood');put('box','metal',x,1.71,z,2.2,0.12,2.2);
    put('box','darkWood',x,0.85,z+1.08,2.1,0.18,0.1,0,0,0.65);
  }
  const barrelSites=[[-15,2],[15,-4],[17,19],[-43,-8],[-65,20],[46,17],[68,20],[73,-20],[4,-43],[-5,-77],[8,58]];
  for(const [x,z] of barrelSites) {
    const group=new THREE.Group();group.position.set(x,0,z);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.55,1.5,9),materials.red);body.position.y=0.75;group.add(body);
    for(const y of [0.2,1.3]) { const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.63,0.63,0.15,9),materials.metal);ring.position.y=y;group.add(ring); }
    const rune=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.7,0.04),materials.orange);rune.position.set(0,0.8,0.61);rune.rotation.z=0.4;group.add(rune);
    const fuse=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.3,5),materials.orange);fuse.position.y=1.65;group.add(fuse);
    scene.add(group);barrels.push({mesh:group,x,z,hp:30,alive:true});
  }
  // Secret caches emit a small readable glimmer; hiding is spatial, not pixel hunting.
  for(const secret of secrets) {
    const group=new THREE.Group();group.position.set(secret.x,0,secret.z);
    const chest=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.85,0.9),materials.bronze);chest.position.y=0.5;group.add(chest);
    const lid=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.18,1),materials.darkWood);lid.position.y=0.99;group.add(lid);
    const gem=new THREE.Mesh(new THREE.OctahedronGeometry(0.3),materials.cyan);gem.position.y=1.8;group.add(gem);
    scene.add(group);secret.mesh=group;animated.push({type:'gem',mesh:gem,phase:random()*6});
  }
  // Overgrowth, scattered cobbles, and border cliff silhouettes.
  for(let i=0;i<640;i++) {
    const x=range(-100,100),z=range(-100,100);
    if((Math.abs(x)<8)||(Math.abs(z-8)<7)||(Math.abs(x)<21&&z>-17&&z<32))continue;
    if(i%3===0)put('rock','moss',x,0.18,z,range(0.2,1),range(0.2,0.6),range(0.2,1),random(),random(),random());
    else put('cone','grass',x,range(0.15,0.3),z,range(0.2,0.6),range(0.3,0.8),range(0.2,0.6),0,random(),range(-0.2,0.2));
  }
  for(let side=0;side<4;side++)for(let i=0;i<17;i++) {
    const a=-108+i*13.5,x=side<2?a:(side===2?-109:109),z=side<2?(side===0?-109:109):a;
    put('rock','darkStone',x,range(3,7),z,range(14,24),range(13,23),range(13,21),0,random(),0);
  }
  colliders.push({x:-110,z:0,w:4,d:224,h:40},{x:110,z:0,w:4,d:224,h:40},{x:0,z:-110,w:224,d:4,h:40},{x:0,z:110,w:224,d:4,h:40});
  // All spawn points must have clearance from solid scenery and be on the ground.
  const clusters=[[-3,1],[12,1],[-11,22],[9,25],[-37,7],[-55,7],[-72,29],[-56,-30],[-85,-19],[35,9],[58,1],[61,31],[79,28],[52,-23],[0,-31],[5,-47],[0,-68],[0,-84],[-6,48],[5,73]];
  for(const [cx,cz]of clusters)for(let i=0;i<4;i++) {
    const x=cx+range(-3,3),z=cz+range(-3,3);
    if(!colliders.some(c=>(c.y||0)<1.5&&Math.abs(x-c.x)<c.w/2+1.5&&Math.abs(z-c.z)<c.d/2+1.5))spawnPoints.push({x,z});
  }
  // Instancing keeps hundreds of props to a few dozen draw calls.
  for(const [key,matrices]of buckets) {
    const [type,material]=key.split(':');
    const mesh=new THREE.InstancedMesh(geometry[type],materials[material],matrices.length);
    matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;
    mesh.receiveShadow=true;mesh.castShadow=!['grass','orange','cyan'].includes(material);mesh.computeBoundingSphere();scene.add(mesh);
  }
  return {
    colliders,spawnPoints,shops,secrets,barrels,
    zoneAt(x,z) { if(z < -47)return 'THE HOLLOW KEEP';if(x < -29)return 'GRAVEWOOD';if(x > 30)return 'SPLINTER CAMP';if(z>38)return 'THE OLD CAUSEWAY';return 'DEBTOR’S COURTYARD'; },
    update(dt,time) {
      for(const a of animated) {
        if(a.type==='gem'){a.mesh.rotation.y=time;a.mesh.position.y=1.8+Math.sin(time*2+a.phase)*0.15;}
        else if(a.type==='light')a.light.intensity=15+Math.sin(time*13)*1.5;
        else { a.mesh.rotation.y=Math.atan2(scene.userData.playerX-a.mesh.position.x,scene.userData.playerZ-a.mesh.position.z)||0;a.mesh.material.opacity=0.28+Math.sin(time*7+a.phase)*0.05; }
      }
    },
  };
}
