import * as THREE from 'three';

// ================= РЕНДЕР / СЦЕНА =================
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b5d6);
scene.fog = new THREE.Fog(0x87b5d6, 130, 480);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 1000);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ================= СВЕТ =================
scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x3a5233, 0.9));
const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
sun.position.set(80, 120, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -200; sun.shadow.camera.right = 200;
sun.shadow.camera.top = 200; sun.shadow.camera.bottom = -200;
sun.shadow.camera.far = 500;
scene.add(sun);

// ================= МИР =================
const WORLD = 380;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD, WORLD),
  new THREE.MeshLambertMaterial({ color: 0x4c7a3d })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Дороги: линии по x и z
const roadMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
const lineMat = new THREE.MeshLambertMaterial({ color: 0xd9d9a0 });
const roadLines = [-120, -40, 40, 120];
roadLines.forEach(p => {
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, WORLD), roadMat);
  r1.position.set(p, 0.1, 0); r1.receiveShadow = true; scene.add(r1);
  const r2 = new THREE.Mesh(new THREE.BoxGeometry(WORLD, 0.2, 14), roadMat);
  r2.position.set(0, 0.1, p); r2.receiveShadow = true; scene.add(r2);
  for (let i = -180; i <= 180; i += 12) {
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.22, 5), lineMat);
    l1.position.set(p, 0.12, i); scene.add(l1);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.22, 0.6), lineMat);
    l2.position.set(i, 0.12, p); scene.add(l2);
  }
});

// Тротуары вокруг дорог
const sideMat = new THREE.MeshLambertMaterial({ color: 0x8d8d8d });
roadLines.forEach(p => {
  [-9.5, 9.5].forEach(off => {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, WORLD), sideMat);
    s1.position.set(p + off, 0.15, 0); s1.receiveShadow = true; scene.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(WORLD, 0.3, 5), sideMat);
    s2.position.set(0, 0.15, p + off); s2.receiveShadow = true; scene.add(s2);
  });
});

// ================= ЗДАНИЯ =================
function makeLabel(text, color = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.55)';
  g.beginPath(); g.roundRect(10, 20, 492, 88, 20); g.fill();
  g.fillStyle = color;
  g.font = 'bold 64px Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sp.scale.set(22, 5.5, 1);
  return sp;
}

const buildings = [];
const city = [
  { x: 0,    z: -80,  w: 44, d: 30, h: 26, color: 0x8d6e63, label: 'ЛИЦЕЙ №1',    type: 'licey' },
  { x: 80,   z: -80,  w: 30, d: 26, h: 22, color: 0x607d8b, label: 'БОЛЬНИЦА',   type: 'hospital' },
  { x: -80,  z: -80,  w: 30, d: 26, h: 16, color: 0x7b1fa2, label: 'МАГАЗИН',    type: 'shop' },
  { x: -80,  z: 0,    w: 30, d: 26, h: 14, color: 0xef6c00, label: 'РАБОТА',     type: 'work' },
  { x: 80,   z: 0,    w: 32, d: 28, h: 20, color: 0x2e7d32, label: 'БАНК',       type: 'bank' },
  { x: 0,    z: 80,   w: 34, d: 28, h: 20, color: 0x1565c0, label: 'ПОЛИЦИЯ',    type: 'police' },
  { x: -80,  z: 80,   w: 30, d: 26, h: 15, color: 0x455a64, label: 'ДОМ',        type: 'house' },
  { x: 80,   z: 80,   w: 28, d: 24, h: 14, color: 0x5d4037, label: 'КАФЕ',       type: 'cafe' },
  { x: -160, z: 0,    w: 34, d: 26, h: 16, color: 0xc62828, label: 'АВТОСАЛОН',  type: 'dealer' },
  { x: -160, z: -80,  w: 24, d: 22, h: 18, color: 0x795548, label: 'ЖИЛОЙ ДОМ',  type: 'house' },
  { x: 160,  z: -80,  w: 24, d: 22, h: 24, color: 0x6d4c41, label: 'ЖИЛОЙ ДОМ',  type: 'house' },
  { x: -160, z: 80,   w: 24, d: 22, h: 20, color: 0x546e7a, label: 'ЖИЛОЙ ДОМ',  type: 'house' },
  { x: 160,  z: 80,   w: 24, d: 22, h: 17, color: 0x827717, label: 'ЖИЛОЙ ДОМ',  type: 'house' },
  { x: 160,  z: 0,    w: 26, d: 24, h: 30, color: 0x37474f, label: 'БИЗНЕС-ЦЕНТР', type: 'biz' },
];

const colliders = [];
city.forEach(b => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(b.w, b.h, b.d),
    new THREE.MeshLambertMaterial({ color: b.color })
  );
  mesh.position.set(b.x, b.h / 2, b.z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  scene.add(mesh);

  const label = makeLabel(b.label, '#ffd700');
  label.position.set(b.x, b.h + 5, b.z);
  scene.add(label);

  colliders.push({ minX: b.x - b.w/2, maxX: b.x + b.w/2, minZ: b.z - b.d/2, maxZ: b.z + b.d/2 });
  buildings.push({ ...b, center: new THREE.Vector3(b.x, 0, b.z) });
});

// Деревья
const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
const leafMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
const treeCells = [[-160, -160], [160, -160], [-160, 160], [160, 160], [160, 0], [0, -160], [0, 160]];
treeCells.forEach(([cx, cz]) => {
  for (let i = 0; i < 5; i++) {
    const tx = cx + (Math.random() - 0.5) * 44;
    const tz = cz + (Math.random() - 0.5) * 44;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 4), trunkMat);
    trunk.position.set(tx, 2, tz); trunk.castShadow = true; scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 0), leafMat);
    crown.position.set(tx, 6, tz); crown.castShadow = true; scene.add(crown);
  }
});

function collides(x, z, r) {
  if (Math.abs(x) > WORLD/2 - 6 || Math.abs(z) > WORLD/2 - 6) return true;
  return colliders.some(c =>
    x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ
  );
}

// ================= ПЕРСОНАЖИ =================
function makeHuman(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.6, 0.75),
    new THREE.MeshLambertMaterial({ color })
  );
  body.position.y = 1.15; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 16, 12),
    new THREE.MeshLambertMaterial({ color: 0xffcc99 })
  );
  head.position.y = 2.4; head.castShadow = true; g.add(head);
  return g;
}

const player = {
  mesh: makeHuman(0xe94560),
  x: 0, z: 0, speed: 10,
  hp: 100, money: 250, level: 1, job: 'Безработный',
  nick: 'Игрок', cooldown: 0, facing: 0,
};
scene.add(player.mesh);
let nameSprite = null;
function setPlayerName(nick) {
  if (nameSprite) scene.remove(nameSprite);
  nameSprite = makeLabel(nick, '#ffffff');
  nameSprite.scale.set(10, 2.6, 1);
  nameSprite.position.y = 4;
  player.mesh.add(nameSprite);
}

// NPC
const npcNames = ['Петрович', 'Санёк', 'Алёна', 'Витёк', 'Марина', 'Гоша', 'Таня', 'Руслан'];
const npcPhrases = [
  'Привет, {nick}! Добро пожаловать в город!',
  'Идёшь в лицей? Там набор новых учеников!',
  'Слышал, на «РАБОТЕ» неплохо платят...',
  'Заходи в магазин, там скидки!',
  'Хочешь заработать? Сходи к зданию РАБОТА.',
  'Красивый городок строят, правда?',
];
const npcs = npcNames.map((name, i) => {
  const mesh = makeHuman(new THREE.Color(`hsl(${i * 45}, 60%, 55%)`));
  const n = {
    mesh, name,
    x: (Math.random() - 0.5) * 220,
    z: (Math.random() - 0.5) * 220,
    dx: 0, dz: 0, t: 0, facing: 0, speed: 4,
  };
  const tag = makeLabel(name, '#8ab4f8');
  tag.scale.set(8, 2, 1); tag.position.y = 3.4;
  mesh.add(tag);
  scene.add(mesh);
  return n;
});

// ================= УПРАВЛЕНИЕ: КЛАВИАТУРА =================
const keys = {};
addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'e') interact(); });
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// ================= УПРАВЛЕНИЕ: ДЖОЙСТИК =================
const joy = document.getElementById('joystick');
const stick = document.getElementById('stick');
let jx = 0, jy = 0, joyId = null;
joy.addEventListener('touchstart', e => {
  e.preventDefault();
  joyId = e.changedTouches[0].identifier;
}, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== joyId) continue;
    const r = joy.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const d = Math.hypot(dx, dy), max = r.width / 2 - 26;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    jx = d > 6 ? dx / max : 0;
    jy = d > 6 ? dy / max : 0;
    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }
}, { passive: false });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      joyId = null; jx = jy = 0;
      stick.style.transform = 'translate(-50%,-50%)';
    }
  }
});

// ================= УПРАВЛЕНИЕ: КАМЕРА =================
let camYaw = Math.PI, camPitch = 0.42, camDist = 16;
let camTouchId = null, lastCX = 0, lastCY = 0;
let mouseDown = false;

canvas.addEventListener('touchstart', e => {
  for (const t of e.changedTouches) {
    if (camTouchId === null && t.clientX > innerWidth * 0.35) {
      camTouchId = t.identifier;
      lastCX = t.clientX; lastCY = t.clientY;
    }
  }
}, { passive: true });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== camTouchId) continue;
    camYaw -= (t.clientX - lastCX) * 0.006;
    camPitch = Math.min(1.35, Math.max(0.05, camPitch + (t.clientY - lastCY) * 0.005));
    lastCX = t.clientX; lastCY = t.clientY;
  }
}, { passive: true });
addEventListener('touchend', e => {
  for (const t of e.changedTouches)
    if (t.identifier === camTouchId) camTouchId = null;
});

canvas.addEventListener('mousedown', e => { mouseDown = true; lastCX = e.clientX; lastCY = e.clientY; });
addEventListener('mouseup', () => mouseDown = false);
addEventListener('mousemove', e => {
  if (!mouseDown) return;
  camYaw -= (e.clientX - lastCX) * 0.006;
  camPitch = Math.min(1.35, Math.max(0.05, camPitch + (e.clientY - lastCY) * 0.005));
  lastCX = e.clientX; lastCY = e.clientY;
});
canvas.addEventListener('wheel', e => {
  camDist = Math.min(30, Math.max(8, camDist + e.deltaY * 0.02));
});

// ================= ЧАТ =================
const chatlog = document.getElementById('chatlog');
function addMsg(text, cls = '') {
  const div = document.createElement('div');
  div.className = 'chat-msg ' + cls;
  div.textContent = text;
  chatlog.appendChild(div);
  while (chatlog.children.length > 5) chatlog.removeChild(chatlog.firstChild);
  setTimeout(() => { if (div.parentNode) { div.style.opacity = '0'; div.style.transition = 'opacity .6s'; } }, 4500);
  setTimeout(() => div.remove(), 5200);
}

// ================= ВЗАИМОДЕЙСТВИЕ =================
const hintBox = document.getElementById('hintBox');
let nearBuilding = null;
function findNearBuilding() {
  let best = null, bd = Infinity;
  for (const b of buildings) {
    const reach = Math.max(b.w, b.d) / 2 + 10;
    const d = Math.hypot(player.x - b.x, player.z - b.z);
    if (d < reach && d < bd) { best = b; bd = d; }
  }
  return best;
}
function interact() {
  if (nearBuilding) {
    switch (nearBuilding.type) {
      case 'licey':
        addMsg('🏫 Лицей №1: уроков пока нет — это каркас, но скоро будут квесты!', 'sys'); break;
      case 'hospital':
        if (player.hp < 100) { player.hp = 100; addMsg('🏥 Вас подлечили! Здоровье: 100%', 'sys'); }
        else addMsg('🏥 Вы здоровы. Приходите в другой раз.', 'sys'); break;
      case 'shop':
        if (player.money >= 50) { player.money -= 50; addMsg('🛒 Куплена еда за 50₽.', 'sys'); }
        else addMsg('🛒 Не хватает денег (нужно 50₽).', 'sys'); break;
      case 'dealer':
        addMsg('🚗 Автосалон: машины появятся в следующем обновлении!', 'sys'); break;
      case 'work':
        if (Date.now() < player.cooldown) {
          addMsg(`💼 Следующая смена через ${Math.ceil((player.cooldown - Date.now()) / 1000)} сек.`, 'sys');
        } else {
          const pay = 80 + Math.floor(Math.random() * 70);
          player.money += pay;
          player.cooldown = Date.now() + 30000;
          addMsg(`💼 Смена завершена! Заработок: +${pay} ₽`, 'sys');
        }
        break;
      case 'cafe':
        if (player.money >= 30) { player.money -= 30; player.hp = Math.min(100, player.hp + 20); addMsg('☕ Кофе за 30₽. +20 здоровья!', 'sys'); }
        else addMsg('☕ Не хватает денег (нужно 30₽).', 'sys'); break;
      case 'police':
        addMsg('👮 Полиция: держим порядок в городе!', 'sys'); break;
      default:
        addMsg(`🏢 ${nearBuilding.label}: загляни позже.`, 'sys');
    }
    return;
  }
  for (const n of npcs) {
    if (Math.hypot(player.x - n.x, player.z - n.z) < 7) {
      const ph = npcPhrases[Math.floor(Math.random() * npcPhrases.length)].replace('{nick}', player.nick);
      addMsg(`${n.name}: ${ph}`, 'npc-msg');
      return;
    }
  }
}
document.getElementById('actionBtn').addEventListener('click', interact);

// ================= ИГРОВОЙ ЦИКЛ =================
let playing = false;
let lastT = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min((t - lastT) / 1000 || 0, 0.05);
  lastT = t;
  if (!playing) { renderer.render(scene, camera); return; }

  // Ввод движения
  let ix = jx, iy = -jy;
  if (keys['w'] || keys['arrowup']) iy += 1;
  if (keys['s'] || keys['arrowdown']) iy -= 1;
  if (keys['a'] || keys['arrowleft']) ix -= 1;
  if (keys['d'] || keys['arrowright']) ix += 1;
  const len = Math.hypot(ix, iy);
  if (len > 1) { ix /= len; iy /= len; }

  // Движение относительно направления камеры
  const fwd = { x: -Math.sin(camYaw), z: -Math.cos(camYaw) };
  const right = { x: Math.cos(camYaw), z: -Math.sin(camYaw) };
  const mx = (fwd.x * iy + right.x * ix) * player.speed * dt;
  const mz = (fwd.z * iy + right.z * ix) * player.speed * dt;

  if (len > 0.1) {
    const nx = player.x + mx, nz = player.z + mz;
    if (!collides(nx, player.z, 1)) player.x = nx;
    if (!collides(player.x, nz, 1)) player.z = nz;
    const target = Math.atan2(mx, mz);
    let d = target - player.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    player.facing += d * Math.min(1, dt * 12);
  }

  player.mesh.position.set(player.x, 0.35, player.z);
  player.mesh.rotation.y = player.facing;

  // NPC бродят
  npcs.forEach(n => {
    n.t -= dt;
    if (n.t <= 0) {
      n.t = 2 + Math.random() * 2.5;
      const a = Math.random() * Math.PI * 2;
      n.dx = Math.cos(a); n.dz = Math.sin(a);
      if (Math.random() < 0.3) { n.dx = 0; n.dz = 0; }
    }
    const nx = n.x + n.dx * n.speed * dt, nz = n.z + n.dz * n.speed * dt;
    if (!collides(nx, n.z, 1)) n.x = nx;
    if (!collides(n.x, nz, 1)) n.z = nz;
    if (n.dx || n.dz) n.facing = Math.atan2(n.dx, n.dz);
    n.mesh.position.set(n.x, 0.35, n.z);
    n.mesh.rotation.y = n.facing;
  });

  // Камера по орбите вокруг игрока
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  const tx = player.x + Math.sin(camYaw) * camDist * cp;
  const ty = 2.5 + sp * camDist;
  const tz = player.z + Math.cos(camYaw) * camDist * cp;
  camera.position.set(tx, ty, tz);
  camera.lookAt(player.x, 2.5, player.z);

  // Подсказка взаимодействия
  nearBuilding = findNearBuilding();
  if (nearBuilding) {
    hintBox.style.display = 'block';
    hintBox.textContent = `⬇ ДЕЙСТВ — ${nearBuilding.label}`;
  } else hintBox.style.display = 'none';

  // HUD
  document.getElementById('money').textContent = player.money;
  document.getElementById('hpFill').style.width = player.hp + '%';

  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// ================= СТАРТ =================
document.getElementById('playBtn').addEventListener('click', () => {
  player.nick = document.getElementById('nickInput').value.trim() || 'Игрок';
  setPlayerName(player.nick);
  document.getElementById('nickBox').textContent = player.nick + ' | Уровень 1';
  document.getElementById('titleScreen').style.display = 'none';
  ['hud', 'joystick', 'actionBtn', 'chatlog'].forEach(id =>
    document.getElementById(id).style.display = 'block');
  playing = true;
  addMsg('🏙️ Добро пожаловать в Licey RP 3D, ' + player.nick + '!', 'sys');
  addMsg('📌 Отправляйся к оранжевому зданию РАБОТА — заработай первый кэш!', 'sys');
});
