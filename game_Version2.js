// Поймай яблоки — простая игра на canvas

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const W = canvas.width;
const H = canvas.height;

let basket = {
  x: W / 2 - 40,
  y: H - 40,
  w: 80,
  h: 18,
  speed: 6,
};

let apples = [];
let lastSpawn = 0;
let spawnInterval = 900; // ms
let score = 0;
let lives = 3;
let running = false;
let lastTime = 0;
let keys = {};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnApple() {
  const r = rand(10, 16);
  apples.push({
    x: rand(r, W - r),
    y: -r,
    r,
    vy: rand(1.6, 3.2) + score * 0.02, // чуть быстрее с ростом очков
  });
}

function drawBasket() {
  ctx.fillStyle = '#6b4cff';
  ctx.beginPath();
  ctx.roundRect = ctx.roundRect || function(x,y,w,h,r){
    if (w<2*r) r=w/2;
    if (h<2*r) r=h/2;
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
  };
  ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 8);
  ctx.fill();
}

function drawApple(a) {
  // тело
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
  ctx.fill();
  // блик
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.arc(a.x - a.r * 0.35, a.y - a.r * 0.35, a.r * 0.35, 0, Math.PI * 2);
  ctx.fill();
  // лист
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.ellipse(a.x + a.r * 0.45, a.y - a.r * 0.7, a.r * 0.4, a.r * 0.2, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function rectCircleColliding(circle, rect) {
  const distX = Math.abs(circle.x - (rect.x + rect.w / 2));
  const distY = Math.abs(circle.y - (rect.y + rect.h / 2));

  if (distX > (rect.w / 2 + circle.r)) { return false; }
  if (distY > (rect.h / 2 + circle.r)) { return false; }

  if (distX <= (rect.w / 2)) { return true; }
  if (distY <= (rect.h / 2)) { return true; }

  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return (dx * dx + dy * dy <= (circle.r * circle.r));
}

function update(dt) {
  // управление
  if (keys['ArrowLeft'] || keys['a']) {
    basket.x -= basket.speed;
  }
  if (keys['ArrowRight'] || keys['d']) {
    basket.x += basket.speed;
  }
  // ограничение по краям
  basket.x = Math.max(0, Math.min(W - basket.w, basket.x));

  // спавн яблок
  lastSpawn += dt;
  const adaptiveInterval = Math.max(380, spawnInterval - score * 6); // ускоряем спавн немного
  if (lastSpawn > adaptiveInterval) {
    spawnApple();
    lastSpawn = 0;
  }

  // движение яблок
  for (let i = apples.length - 1; i >= 0; i--) {
    const a = apples[i];
    a.y += a.vy;
    // проверка поимки
    if (rectCircleColliding(a, basket)) {
      score += 1;
      apples.splice(i, 1);
      continue;
    }
    // пропуск
    if (a.y - a.r > H) {
      apples.splice(i, 1);
      lives -= 1;
      if (lives <= 0) {
        running = false;
        restartBtn.style.display = 'inline-block';
        startBtn.style.display = 'none';
      }
    }
  }

  scoreEl.textContent = 'Очки: ' + score;
  livesEl.textContent = 'Жизни: ' + lives;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  // нарисуем землю (тонкая полоска)
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, H - 12, W, 12);

  // яблоки
  for (const a of apples) drawApple(a);

  // корзина
  drawBasket();

  if (!running && lives <= 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Игра окончена', W / 2, H / 2 - 10);
    ctx.font = '18px sans-serif';
    ctx.fillText('Нажмите "Перезапустить"', W / 2, H / 2 + 18);
  }
}

function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;
  if (running) {
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

// события
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  basket.x = mx - basket.w / 2;
});
canvas.addEventListener('touchmove', e => {
  if (!e.touches) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.touches[0].clientX - rect.left;
  basket.x = mx - basket.w / 2;
}, {passive:true});

startBtn.addEventListener('click', () => {
  if (running) return;
  running = true;
  startBtn.style.display = 'none';
  restartBtn.style.display = 'none';
});

restartBtn.addEventListener('click', () => {
  reset();
  running = true;
  restartBtn.style.display = 'none';
  startBtn.style.display = 'none';
});

function reset() {
  apples = [];
  lastSpawn = 0;
  score = 0;
  lives = 3;
  basket.x = W / 2 - basket.w / 2;
  scoreEl.textContent = 'Очки: 0';
  livesEl.textContent = 'Жизни: 3';
  lastTime = 0;
}

// start loop
reset();
requestAnimationFrame(loop);