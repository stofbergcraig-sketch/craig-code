import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// One set of instanced meshes renders the entire living crowd and its ragdolls.
const MAX_LIVE = 650;
const MAX_CORPSES = 70;
const CAPACITY = MAX_LIVE + MAX_CORPSES;
const TYPES = [
  { hp: 35, speed: 4.15, scale: 1, damage: 5, tint: 0xffffff },
  { hp: 22, speed: 6.35, scale: .78, damage: 4, tint: 0xd9ffac },
  { hp: 90, speed: 2.85, scale: 1.28, damage: 10, tint: 0xc9d8a9 },
];
const up = new THREE.Vector3(0, 1, 0);
const zero = new THREE.Vector3();

function colored(geometry, color, position = [0, 0, 0], rotation = [0, 0, 0]) {
  geometry.rotateX(rotation[0]); geometry.rotateY(rotation[1]); geometry.rotateZ(rotation[2]);
  geometry.translate(...position);
  const c = new THREE.Color(color);
  const data = new Float32Array(geometry.attributes.position.count * 3);
  for (let i = 0; i < data.length; i += 3) { data[i] = c.r; data[i + 1] = c.g; data[i + 2] = c.b; }
  geometry.setAttribute('color', new THREE.BufferAttribute(data, 3));
  return geometry.index ? geometry.toNonIndexed() : geometry;
}

function combine(parts) { return mergeGeometries(parts, false); }
function box(w, h, d, color, pos, rot) { return colored(new THREE.BoxGeometry(w, h, d), color, pos, rot); }

export class EnemySystem {
  constructor(scene, world, { onKill = () => {}, onPlayerHit = () => {}, onImpact = () => {} } = {}) {
    this.scene = scene; this.world = world;
    this.onKill = onKill; this.onPlayerHit = onPlayerHit; this.onImpact = onImpact;
    this.enemies = Array.from({ length: MAX_LIVE }, (_, id) => ({
      id, active: false, counted: false, position: new THREE.Vector3(), velocity: new THREE.Vector3(),
      hp: 0, type: 0, yaw: 0, phase: Math.random() * Math.PI * 2,
      attack: Math.random(), stun: 0, flash: 0, lastChain: -10,
    }));
    this.corpses = [];
    this._corpsePool = [];
    this._alive = 0; this._nextSlot = 0; this._budget = 45; this._clock = 0;
    this._hitCooldown = 0; this._spawnClock = 0;
    this.grid = new Map(); this.setQuality('medium');
    this._tmp = new THREE.Vector3(); this._dir = new THREE.Vector3();
    this._matrix = new THREE.Matrix4(); this._root = new THREE.Matrix4();
    this._part = new THREE.Object3D(); this._object = new THREE.Object3D();
    this._color = new THREE.Color();
    this.material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, flatShading: true });
    const skin = 0x77ae3d, skinLight = 0x8dc74c, ear = 0x5e8c36;
    const head = combine([
      colored(new THREE.IcosahedronGeometry(.34, 1), skin, [0, .02, 0]),
      box(.32, .2, .29, skinLight, [0, -.09, .14]),
      colored(new THREE.ConeGeometry(.13, .45, 3), ear, [-.39, .06, 0], [0, 0, 1.1]),
      colored(new THREE.ConeGeometry(.13, .45, 3), ear, [.39, .06, 0], [0, 0, -1.1]),
      box(.16, .125, .07, 0xe2e7ac, [-.142, .085, .274], [0, 0, -.14]),
      box(.16, .125, .07, 0xe2e7ac, [.142, .085, .274], [0, 0, .14]),
      box(.055, .09, .035, 0x101b18, [-.12, .075, .318]),
      box(.055, .09, .035, 0x101b18, [.12, .075, .318]),
      box(.19, .045, .055, 0x223323, [-.14, .17, .28], [0, 0, -.2]),
      box(.19, .045, .055, 0x223323, [.14, .17, .28], [0, 0, .2]),
      colored(new THREE.ConeGeometry(.1, .23, 4), skinLight, [0, -.01, .35], [Math.PI / 2, 0, 0]),
      box(.2, .065, .04, 0x243020, [0, -.16, .283]),
      box(.045, .08, .04, 0xffe7ae, [-.065, -.155, .31], [0, 0, .1]),
      box(.045, .075, .04, 0xffe7ae, [.065, -.15, .31], [0, 0, -.1]),
    ]);
    const body = combine([
      colored(new THREE.CylinderGeometry(.22, .29, .48, 5), 0x77563a, [0, -.1, 0]),
      box(.52, .09, .35, 0x322f26, [0, -.23, 0]),
      box(.085, .095, .055, 0xb7a969, [0, -.23, .2]),
      box(.10, .4, .365, 0x454638, [.09, -.065, 0], [0, 0, -.25]),
    ]);
    const arm = combine([
      colored(new THREE.CylinderGeometry(.075, .105, .32, 5), skin, [0, -.1, 0]),
      box(.17, .18, .16, skinLight, [0, -.31, 0]),
    ]);
    const clubArm = combine([
      arm.clone(),
      colored(new THREE.CylinderGeometry(.035, .035, .55, 5), 0x59472f, [0, -.31, .19], [Math.PI / 2, 0, 0]),
      box(.18, .16, .23, 0x514f42, [0, -.31, .42]),
    ]);
    const leg = combine([
      box(.13, .25, .14, 0x4c5132, [0, -.1, 0]),
      box(.17, .11, .25, 0x2d3026, [0, -.255, .04]),
    ]);
    const helmet = combine([
      colored(new THREE.CylinderGeometry(.12, .34, .2, 5, 1), 0x677877, [0, .26, -.015]),
      box(.07, .2, .58, 0x8c9990, [0, .29, 0]),
    ]);
    const specs = [
      ['body', body], ['head', head], ['armL', arm], ['armR', clubArm],
      ['legL', leg], ['legR', leg.clone()], ['helmet', helmet],
    ];
    this.meshes = specs.map(([name, geometry]) => {
      const mesh = new THREE.InstancedMesh(geometry, this.material, CAPACITY);
      mesh.name = `goblins-${name}`; mesh.count = 0;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = false;
      scene.add(mesh); return { name, mesh };
    });
  }

  get aliveCount() { return this._alive; }

  clear() {
    for (const e of this.enemies) { e.active = false; e.counted = false; }
    this._alive = 0; this.corpses.length = 0; this.grid.clear(); this._budget = 35;
    for (const { mesh } of this.meshes) mesh.count = 0;
  }

  setQuality(quality) {
    this.quality = quality;
    this.maxAlive = quality === 'low' ? 200 : quality === 'high' ? 650 : 400;
    this.maxCorpses = quality === 'low' ? 24 : quality === 'high' ? 70 : 45;
    this.spawnRateCap = quality === 'low' ? 60 : quality === 'high' ? 120 : 90;
    if (this.enemies) {
      let count = 0;
      for (const e of this.enemies) if (e.active && ++count > this.maxAlive) { e.active = false; this._alive--; }
    }
  }

  _clearAt(x, z, radius = .55) {
    if (Math.abs(x) > 105 || Math.abs(z) > 105) return false;
    for (const b of this.world.colliders || []) {
      if (!b.legendary && ((b.y || 0) > 1.6 || b.h < .45)) continue;
      if (Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius) return false;
    }
    return true;
  }

  spawn(x, z, type = 0) {
    if (this._alive >= this.maxAlive || !this._clearAt(x, z)) return null;
    let e;
    for (let i = 0; i < MAX_LIVE; i++) {
      const candidate = this.enemies[this._nextSlot++ % MAX_LIVE];
      if (!candidate.active) { e = candidate; break; }
    }
    if (!e) return null;
    const t = TYPES[type] || TYPES[0];
    e.active = true; e.counted = false; e.type = type; e.hp = t.hp;
    e.position.set(x, 0, z); e.velocity.set(0, 0, 0);
    e.yaw = Math.random() * Math.PI * 2; e.stun = 0; e.flash = 0;
    e.attack = .4 + Math.random() * .7; e.lastChain = -10;
    e.panic=0;e.think=0;e.fleeX=0;e.fleeZ=1;e.stumbleAt=2+Math.random()*5;e.stumble=0;
    this._alive++;
    return e;
  }

  _spawnWave(player, progress, dt) {
    const kills = progress.kills || 0;
    const target = Math.min(this.maxAlive, 52 + Math.sqrt(kills) * 4.4);
    const rate = Math.min(this.spawnRateCap, 10 + Math.sqrt(kills) * 1.9);
    this._budget = Math.min(55, this._budget + dt * rate);
    let tries = 0;
    while (this._budget >= 1 && this._alive < target && tries++ < 28) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 18;
      let x = player.position.x + Math.sin(angle) * distance;
      let z = player.position.z + Math.cos(angle) * distance;
      if (Math.random() < .2 && this.world.spawnPoints?.length) {
        const point = this.world.spawnPoints[Math.floor(Math.random() * this.world.spawnPoints.length)];
        const pd = Math.hypot(point.x - player.position.x, point.z - player.position.z);
        if (pd > 13 && pd < 48) { x = point.x + (Math.random() - .5) * 5; z = point.z + (Math.random() - .5) * 5; }
      }
      let type = 0;
      if (kills > 50 && Math.random() < .19) type = 1;
      if (kills > 200 && Math.random() < .12) type = 2;
      const spawned = this.spawn(x, z, type);
      if (spawned) this._budget--;
    }
  }

  _buildGrid() {
    this.grid.clear();
    for (const e of this.enemies) {
      if (!e.active) continue;
      const key = `${Math.floor(e.position.x / 3)},${Math.floor(e.position.z / 3)}`;
      let list = this.grid.get(key);
      if (!list) { list = []; this.grid.set(key, list); }
      list.push(e);
    }
  }

  _near(position, callback) {
    const gx = Math.floor(position.x / 3), gz = Math.floor(position.z / 3);
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const list = this.grid.get(`${gx + dx},${gz + dz}`);
      if (list) for (const e of list) if (e.active) callback(e);
    }
  }

  _move(e, dt) {
    const p = e.position, r = .3 * TYPES[e.type].scale;
    const oldX = p.x, oldZ = p.z;
    p.x += e.velocity.x * dt;
    p.z += e.velocity.z * dt;
    let collided = false;
    for (const b of this.world.colliders || []) {
      if (p.y >= (b.y || 0) + b.h || p.y + 1.3 < (b.y || 0)) continue;
      const ex = b.w / 2 + r, ez = b.d / 2 + r;
      if (Math.abs(p.x - b.x) < ex && Math.abs(p.z - b.z) < ez) {
        if (Math.abs(oldX - b.x) >= ex) { p.x = oldX; e.velocity.x *= -.32; }
        else if (Math.abs(oldZ - b.z) >= ez) { p.z = oldZ; e.velocity.z *= -.32; }
        else {
          const rx = ex - Math.abs(p.x - b.x), rz = ez - Math.abs(p.z - b.z);
          if (rx < rz) p.x = b.x + (p.x < b.x ? -ex : ex);
          else p.z = b.z + (p.z < b.z ? -ez : ez);
        }
        collided = true;
      }
    }
    p.x = THREE.MathUtils.clamp(p.x, -105, 105); p.z = THREE.MathUtils.clamp(p.z, -105, 105);
    return collided;
  }

  update(dt, player, time, progress = {}) {
    dt = Math.min(dt, .05); this._clock = time;
    this._hitCooldown = Math.max(0, this._hitCooldown - dt);
    this._spawnWave(player, progress, dt);
    this._buildGrid();
    for (const e of this.enemies) {
      if (!e.active) continue;
      const t = TYPES[e.type], p = e.position;
      const dx = player.position.x - p.x, dz = player.position.z - p.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 85) { e.active = false; this._alive--; continue; }
      e.flash = Math.max(0, e.flash - dt); e.attack -= dt;
      if (e.stun > 0 || p.y > .05) {
        e.stun = Math.max(0, e.stun - dt);
        const speed = Math.hypot(e.velocity.x, e.velocity.z);
        if (speed > 9) this._chain(e, speed);
        e.velocity.x *= Math.exp(-dt * 1.9); e.velocity.z *= Math.exp(-dt * 1.9);
        e.velocity.y -= 25 * dt; p.y += e.velocity.y * dt;
        if (p.y < 0) { p.y = 0; e.velocity.y = 0; }
        if (this._move(e, dt) && speed > 10) this._damage(e, speed * 1.8, zero, 0);
      } else {
        if(distance<18)e.panic=2.3;
        else e.panic=Math.max(0,e.panic-dt);
        e.think-=dt;e.stumbleAt-=dt;e.stumble=Math.max(0,e.stumble-dt);
        if(e.panic>0&&e.stumbleAt<=0){e.stumble=.23;e.stumbleAt=4.5+Math.random()*4;}
        if(e.think<=0){
          e.think=.18+Math.random()*.06;
          if(e.panic>0)this._near(p,other=>{if(other!==e&&other.panic<.5)other.panic=1.4;});
          const away=e.panic>0?Math.atan2(-dx,-dz):e.yaw+Math.sin(time*.3+e.phase)*.15;
          let best=-Infinity;
          // Score stable headings against future clearance. Prefer broad arcs to jitter.
          for(const turn of [0,.45,-.45,.9,-.9,1.5,-1.5,2.2,-2.2,Math.PI]){
            const angle=away+turn,tx=Math.sin(angle),tz=Math.cos(angle);
            let clearance=4.5;
            for(const step of [.9,2.2,4.5]){if(!this._clearAt(p.x+tx*step,p.z+tz*step,.65)){clearance=step-.9;break;}}
            const edge=Math.max(0,Math.abs(p.x+tx*5)-97)+Math.max(0,Math.abs(p.z+tz*5)-97);
            const score=clearance*3+Math.cos(turn)*1.8+(tx*e.fleeX+tz*e.fleeZ)*.65-edge*6;
            if(score>best){best=score;e.fleeX=tx;e.fleeZ=tz;}
          }
        }
        let vx=e.fleeX,vz=e.fleeZ;
        const speed=e.stumble>0?1.8:e.panic>0?(distance<2.5?7.5:e.type===1?13.1:e.type===2?11.9:12.5):1.5;
        e.velocity.x = THREE.MathUtils.damp(e.velocity.x,vx*speed,8,dt); e.velocity.z = THREE.MathUtils.damp(e.velocity.z,vz*speed,8,dt);
        // Tiny local repulsion keeps the crowd readable without an O(n²) solve.
        if ((e.id & 1) === (Math.floor(time * 60) & 1)) this._near(p, other => {
          if (other === e) return;
          const ox = p.x - other.position.x, oz = p.z - other.position.z;
          const d2 = ox * ox + oz * oz;
          if (d2 > .001 && d2 < .65) {
            const push = (1 - Math.sqrt(d2) / .81) * 2.5;
            e.velocity.x += ox / Math.sqrt(d2) * push;
            e.velocity.z += oz / Math.sqrt(d2) * push;
          }
        });
        this._move(e, dt);
        const targetYaw=Math.atan2(e.velocity.x,e.velocity.z);e.yaw+=Math.atan2(Math.sin(targetYaw-e.yaw),Math.cos(targetYaw-e.yaw))*Math.min(1,dt*12);
        if (distance < 1.55 && Math.abs(player.position.y - p.y) < 1.7 && e.attack <= 0 && this._hitCooldown <= 0) {
          this.onPlayerHit(t.damage); this._hitCooldown = .16; e.attack = .9 + Math.random() * .5;
        }
      }
    }
    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const c = this.corpses[i]; c.life -= dt;
      if (c.life <= 0) { this.corpses.splice(i, 1); this._corpsePool.push(c); continue; }
      const speed = Math.hypot(c.velocity.x, c.velocity.z);
      if (speed > 7) this._chain(c, speed);
      c.velocity.y -= 22 * dt; c.position.addScaledVector(c.velocity, dt);
      if (c.position.y < .16) {
        c.position.y = .16; c.velocity.y = Math.abs(c.velocity.y) > 2 ? Math.abs(c.velocity.y) * .28 : 0;
        c.velocity.x *= Math.exp(-dt * 5); c.velocity.z *= Math.exp(-dt * 5);
      } else { c.velocity.x *= Math.exp(-dt * .5); c.velocity.z *= Math.exp(-dt * .5); }
      c.spin.x += c.spinVelocity.x * dt; c.spin.z += c.spinVelocity.z * dt;
      for (const b of this.world.colliders || []) {
        if (c.position.y > (b.y || 0) + b.h || c.position.y + .4 < (b.y || 0)) continue;
        if (Math.abs(c.position.x - b.x) < b.w / 2 + .2 && Math.abs(c.position.z - b.z) < b.d / 2 + .2) {
          c.position.x -= c.velocity.x * dt * 1.2; c.position.z -= c.velocity.z * dt * 1.2;
          c.velocity.x *= -.35; c.velocity.z *= -.35;
        }
      }
    }
    this._render(time);
  }

  _chain(source, speed) {
    this._near(source.position, target => {
      if (target === source || this._clock - target.lastChain < .18) return;
      const dx = target.position.x - source.position.x, dz = target.position.z - source.position.z;
      if (dx * dx + dz * dz > 1.15 || Math.abs(source.position.y - target.position.y) > 1.4) return;
      target.lastChain = this._clock;
      this._dir.copy(source.velocity).normalize();
      this._damage(target, Math.min(55, speed * 2.1), this._dir, Math.min(16, speed * .65));
      source.velocity.x *= .76; source.velocity.z *= .76;
    });
  }

  _damage(e, damage, direction, force) {
    if (!e.active || e.counted) return false;
    e.hp -= damage; e.flash = .1; e.stun = Math.max(e.stun, .18 + force * .025);
    e.velocity.addScaledVector(direction, force);
    e.velocity.y = Math.max(e.velocity.y, Math.min(10, force * .28));
    this._tmp.copy(e.position); this._tmp.y += .75;
    this.onImpact(this._tmp.clone(), 0xa7d93a, e.hp <= 0 ? 1 : .45);
    if (e.hp <= 0) this._kill(e);
    return true;
  }

  _wallDistance(origin, direction, maximum) {
    let nearest = maximum;
    for (const b of this.world.colliders || []) {
      let near = 0, far = nearest;
      const bounds = [
        [origin.x, direction.x, b.x - b.w / 2, b.x + b.w / 2],
        [origin.y, direction.y, b.y || 0, (b.y || 0) + b.h],
        [origin.z, direction.z, b.z - b.d / 2, b.z + b.d / 2],
      ];
      let intersects = true;
      for (const [o, d, min, max] of bounds) {
        if (Math.abs(d) < .00001) { if (o < min || o > max) { intersects = false; break; } }
        else {
          const a = (min - o) / d, c = (max - o) / d;
          near = Math.max(near, Math.min(a, c)); far = Math.min(far, Math.max(a, c));
          if (near > far) { intersects = false; break; }
        }
      }
      if (intersects && near < nearest && far >= 0) nearest = near;
    }
    return nearest;
  }

  _kill(e) {
    if (!e.active || e.counted) return;
    e.counted = true; e.active = false; this._alive--;
    this.onKill(e);
    let c = this._corpsePool.pop();
    if (!c && this.corpses.length >= this.maxCorpses) c = this.corpses.shift();
    if (!c) c = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), spin: new THREE.Vector3(), spinVelocity: new THREE.Vector3() };
    c.position.copy(e.position); c.position.y += .3;
    c.velocity.copy(e.velocity);
    if (c.velocity.lengthSq() < 16) c.velocity.set(Math.sin(e.yaw) * -3, 5, Math.cos(e.yaw) * -3);
    c.velocity.y = Math.max(c.velocity.y, 4);
    c.type = e.type; c.yaw = e.yaw; c.life = 2.2 + Math.random() * 1.3;
    c.spin.set(0, 0, 0); c.spinVelocity.set((Math.random() - .5) * 12, 0, (Math.random() - .5) * 12);
    this.corpses.push(c);
  }

  hitCone(origin, forward, range, cosAngle, damage, force) {
    let hits = 0;
    const len = Math.hypot(forward.x, forward.z) || 1;
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.position.x - origin.x, dz = e.position.z - origin.z;
      const d = Math.hypot(dx, dz);
      if (d > range + .3 || Math.abs(e.position.y + .7 - origin.y) > range * .7 + .6) continue;
      if (d > .6 && (dx * forward.x + dz * forward.z) / (d * len) < cosAngle) continue;
      this._tmp.copy(e.position); this._tmp.y += .8; this._tmp.sub(origin);
      const rayLength = this._tmp.length(); this._tmp.normalize();
      if (this._wallDistance(origin, this._tmp, rayLength) < rayLength - .2) continue;
      this._dir.set(dx / (d || 1), .2, dz / (d || 1));
      if (this._damage(e, damage, this._dir, force)) hits++;
    }
    return hits;
  }

  hitRay(origin, direction, range, damage, force, width = .6) {
    let nearest = null, nearestDistance = this._wallDistance(origin, direction, range);
    for (const e of this.enemies) {
      if (!e.active) continue;
      this._tmp.copy(e.position); this._tmp.y += .78 * TYPES[e.type].scale; this._tmp.sub(origin);
      const along = this._tmp.dot(direction);
      if (along < 0 || along > nearestDistance) continue;
      const radius = width + .34 * TYPES[e.type].scale;
      if (this._tmp.lengthSq() - along * along < radius * radius) { nearest = e; nearestDistance = along; }
    }
    if (!nearest) return 0;
    return this._damage(nearest, damage, direction, force) ? 1 : 0;
  }

  blast(position, radius, damage, force) {
    let hits = 0;
    for (const e of this.enemies) {
      if (!e.active) continue;
      this._dir.copy(e.position).sub(position); this._dir.y += .5;
      const distance = this._dir.length();
      if (distance > radius) continue;
      this._dir.normalize(); this._dir.y = .45;
      // Keep outer-edge damage substantial: crowd clearing should be dependable.
      if (this._damage(e, damage * (1 - .25 * distance / radius), this._dir, force)) hits++;
    }
    return hits;
  }

  _render(time) {
    let index = 0;
    for (const e of this.enemies) if (e.active) this._renderOne(e, index++, time, false);
    for (const c of this.corpses) this._renderOne(c, index++, time, true);
    for (const { mesh } of this.meshes) {
      mesh.count = index; mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }

  _renderOne(e, index, time, dead) {
    const type = TYPES[e.type], scale = type.scale;
    const walk = dead ? 0 : Math.sin(time * (e.panic>0?23:e.type === 1 ? 18 : 11) + e.phase);
    const bob = dead ? 0 : Math.abs(walk) * .055;
    const object = this._object, part = this._part;
    object.position.copy(e.position); object.position.y += bob;
    object.rotation.set(dead ? e.spin.x : e.panic>0?.18:0, e.yaw, dead ? e.spin.z : walk * (e.panic>0?.065:.035));
    const fade = dead ? Math.min(1, e.life * 2) : 1;
    object.scale.setScalar(scale * fade); object.updateMatrix();
    this._root.copy(object.matrix);
    this._color.setHex(!dead && e.flash > 0 ? 0xffd5b0 : type.tint);
    for (const { name, mesh } of this.meshes) {
      part.position.set(0, 0, 0); part.rotation.set(0, 0, 0); part.scale.setScalar(1);
      switch (name) {
        case 'body': part.position.y = .7; part.rotation.z = dead ? .1 : walk * .035; break;
        case 'head': part.position.y = 1.16; part.rotation.z = dead ? -.15 : -walk * .06; break;
        case 'helmet': part.position.y = 1.16; part.scale.setScalar(e.type === 2 ? 1 : 0); break;
        case 'armL': part.position.set(-.29, .84, 0); part.rotation.x = dead ? -1 : walk * .6; part.rotation.z = .2; break;
        case 'armR': part.position.set(.29, .84, 0); part.rotation.x = dead ? -1.8 : -walk * .6 - (e.attack < .18 ? 1.3 : 0); part.rotation.z = -.2; break;
        case 'legL': part.position.set(-.13, .32, 0); part.rotation.x = dead ? .8 : -walk * .65; break;
        case 'legR': part.position.set(.13, .32, 0); part.rotation.x = dead ? -.3 : walk * .65; break;
      }
      part.updateMatrix(); this._matrix.multiplyMatrices(this._root, part.matrix);
      mesh.setMatrixAt(index, this._matrix); mesh.setColorAt(index, this._color);
    }
  }

  dispose() {
    for (const { mesh } of this.meshes) { this.scene.remove(mesh); mesh.geometry.dispose(); mesh.dispose(); }
    this.material.dispose();
  }
}
