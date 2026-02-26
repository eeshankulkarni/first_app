(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const hud = {
    score: document.getElementById('score'),
    coins: document.getElementById('coins'),
    lives: document.getElementById('lives'),
    status: document.getElementById('status')
  };

  const keys = new Set();
  const gravity = 0.52;

  const world = {
    width: canvas.width,
    height: canvas.height,
    groundY: 460,
    levelEndX: 910
  };

  const initialState = () => ({
    player: {
      x: 64,
      y: 360,
      w: 30,
      h: 42,
      vx: 0,
      vy: 0,
      speed: 3.7,
      jump: -11.5,
      onGround: false,
      invuln: 0
    },
    cameraX: 0,
    score: 0,
    lives: 3,
    collectedCoins: 0,
    gameState: 'running',
    platforms: [
      { x: 0, y: 460, w: 1040, h: 80 },
      { x: 165, y: 392, w: 120, h: 20 },
      { x: 330, y: 336, w: 130, h: 18 },
      { x: 535, y: 295, w: 140, h: 18 },
      { x: 720, y: 355, w: 120, h: 18 },
      { x: 880, y: 320, w: 120, h: 18 }
    ],
    coins: [
      { x: 120, y: 420, r: 9, taken: false },
      { x: 195, y: 355, r: 9, taken: false },
      { x: 260, y: 355, r: 9, taken: false },
      { x: 370, y: 300, r: 9, taken: false },
      { x: 440, y: 300, r: 9, taken: false },
      { x: 575, y: 260, r: 9, taken: false },
      { x: 760, y: 320, r: 9, taken: false },
      { x: 915, y: 285, r: 9, taken: false }
    ],
    enemies: [
      { x: 305, y: 434, w: 28, h: 26, min: 220, max: 390, vx: 1.4 },
      { x: 612, y: 269, w: 28, h: 26, min: 540, max: 640, vx: 1.2 },
      { x: 930, y: 294, w: 28, h: 26, min: 890, max: 970, vx: 1.0 }
    ]
  });

  let game = initialState();

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const resetPlayer = () => {
    game.player.x = 64;
    game.player.y = 360;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.onGround = false;
    game.cameraX = 0;
  };

  const restart = () => {
    game = initialState();
  };

  const hurtPlayer = () => {
    if (game.player.invuln > 0 || game.gameState !== 'running') return;
    game.lives -= 1;
    game.player.invuln = 80;
    if (game.lives <= 0) {
      game.gameState = 'lost';
      return;
    }
    resetPlayer();
  };

  const update = () => {
    if (game.gameState !== 'running') return;

    const p = game.player;
    p.vx = 0;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) p.vx = -p.speed;
    if (keys.has('ArrowRight') || keys.has('KeyD')) p.vx = p.speed;

    if ((keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW')) && p.onGround) {
      p.vy = p.jump;
      p.onGround = false;
    }

    p.vy += gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.onGround = false;

    if (p.x < 0) p.x = 0;
    if (p.x + p.w > world.width) p.x = world.width - p.w;

    for (const plat of game.platforms) {
      if (
        overlap(p, plat) &&
        p.vy >= 0 &&
        p.y + p.h - p.vy <= plat.y
      ) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    }

    if (p.y > world.height + 50) {
      hurtPlayer();
    }

    for (const coin of game.coins) {
      if (coin.taken) continue;
      const box = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
      if (overlap(p, box)) {
        coin.taken = true;
        game.collectedCoins += 1;
        game.score += 100;
      }
    }

    for (const e of game.enemies) {
      e.x += e.vx;
      if (e.x <= e.min || e.x + e.w >= e.max) e.vx *= -1;
      if (overlap(p, e)) {
        const stomp = p.vy > 1 && p.y + p.h - p.vy <= e.y + 4;
        if (stomp) {
          e.x = -2000;
          e.min = -2000;
          e.max = -2000;
          p.vy = -7.5;
          game.score += 250;
        } else {
          hurtPlayer();
        }
      }
    }

    if (p.invuln > 0) p.invuln -= 1;

    game.cameraX = Math.max(0, Math.min(p.x - 260, world.width - canvas.width));

    if (game.collectedCoins === game.coins.length && p.x >= world.levelEndX) {
      game.gameState = 'won';
      game.score += 500;
    }
  };

  const drawBackground = () => {
    const cam = game.cameraX;

    ctx.fillStyle = '#79c4ff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#56ad5f';
    ctx.fillRect(0, world.groundY, canvas.width, canvas.height - world.groundY);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 210 - cam * 0.35) % (canvas.width + 120)) - 60;
      const y = 70 + (i % 2) * 26;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.arc(x + 22, y - 9, 16, 0, Math.PI * 2);
      ctx.arc(x + 40, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = () => {
    drawBackground();
    const cam = game.cameraX;

    for (const plat of game.platforms) {
      ctx.fillStyle = '#8d5d34';
      ctx.fillRect(plat.x - cam, plat.y, plat.w, plat.h);
      ctx.fillStyle = '#4ea24f';
      ctx.fillRect(plat.x - cam, plat.y, plat.w, 6);
    }

    for (const coin of game.coins) {
      if (coin.taken) continue;
      const x = coin.x - cam;
      ctx.fillStyle = '#f9db38';
      ctx.beginPath();
      ctx.arc(x, coin.y, coin.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b88f16';
      ctx.stroke();
    }

    for (const e of game.enemies) {
      if (e.x < -1000) continue;
      const ex = e.x - cam;
      ctx.fillStyle = '#8a3d1d';
      ctx.fillRect(ex, e.y, e.w, e.h);
      ctx.fillStyle = '#fff';
      ctx.fillRect(ex + 4, e.y + 7, 5, 5);
      ctx.fillRect(ex + 18, e.y + 7, 5, 5);
    }

    const p = game.player;
    const px = p.x - cam;
    if (p.invuln % 6 < 3) {
      ctx.fillStyle = '#df2025';
      ctx.fillRect(px, p.y, p.w, p.h);
      ctx.fillStyle = '#0b6ab2';
      ctx.fillRect(px, p.y + 18, p.w, p.h - 18);
      ctx.fillStyle = '#f2c59f';
      ctx.fillRect(px + 8, p.y + 5, 14, 10);
    }

    const flagX = world.levelEndX - cam;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(flagX, 228, 4, 232);
    ctx.fillStyle = '#2dc949';
    ctx.fillRect(flagX + 4, 236, 34, 22);

    if (game.gameState !== 'running') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 52px Arial';
      ctx.fillText(game.gameState === 'won' ? 'You Win!' : 'Game Over', canvas.width / 2, 230);
      ctx.font = '24px Arial';
      ctx.fillText('Press R to restart', canvas.width / 2, 278);
    }
  };

  const updateHud = () => {
    hud.score.textContent = `Score: ${game.score}`;
    hud.coins.textContent = `Coins: ${game.collectedCoins}/${game.coins.length}`;
    hud.lives.textContent = `Lives: ${game.lives}`;
    const status = game.gameState === 'running' ? 'Running' : game.gameState === 'won' ? 'You Win!' : 'Game Over';
    hud.status.textContent = `Status: ${status}`;
  };

  const tick = () => {
    update();
    draw();
    updateHud();
    requestAnimationFrame(tick);
  };

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyR') {
      restart();
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(event.code)) {
      keys.add(event.code);
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  tick();
})();
