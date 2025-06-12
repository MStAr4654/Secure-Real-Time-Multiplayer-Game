import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let players = {};
let myId = null;
let collectible = new Collectible(0, 0);

// Set a random starting position
let x = Math.random() * 500;
let y = Math.random() * 500;

document.addEventListener('keydown', e => {
  const speed = 5;
  if (e.key === 'ArrowUp') y -= speed;
  if (e.key === 'ArrowDown') y += speed;
  if (e.key === 'ArrowLeft') x -= speed;
  if (e.key === 'ArrowRight') x += speed;

  if (players[myId]) {
    players[myId].x = x;
    players[myId].y = y;
    socket.emit('move', { x, y });
    draw();
  }
});

// Receive initial state
socket.on('init', data => {
  myId = data.id;

  // Create player objects
  for (const id in data.players) {
    const p = data.players[id];
    players[id] = new Player(p.x, p.y, p.score);
  }

  collectible = new Collectible(data.collectible.x, data.collectible.y);
  draw();
});

socket.on('new-player', ({ id, player }) => {
  players[id] = new Player(player.x, player.y, player.score);
});

socket.on('player-moved', ({ id, x, y }) => {
  if (players[id]) {
    players[id].x = x;
    players[id].y = y;
  }
});

socket.on('collected', data => {
  collectible = new Collectible(data.collectible.x, data.collectible.y);
  players[data.id].score = data.score;
});

socket.on('player-disconnected', id => {
  delete players[id];
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw collectible
  collectible.draw(ctx);

  // Draw players
  for (const id in players) {
    const p = players[id];
    const isMe = id === myId;
    p.draw(ctx, isMe);
  }

  // Draw leaderboard (top 3)
  const ranked = Object.entries(players).sort(([, a], [, b]) => b.score - a.score);
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(`Leaderboard:`, 10, 20);
  ranked.slice(0, 3).forEach(([id, p], i) => {
    ctx.fillText(`${i + 1}. ${id.substring(0, 5)}: ${p.score}`, 10, 40 + i * 20);
  });
}

document.addEventListener('keydown', e => {
  const speed = 5;

  // Prevent default scroll behavior for arrow keys
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }

  if (e.key === 'ArrowUp') y -= speed;
  if (e.key === 'ArrowDown') y += speed;
  if (e.key === 'ArrowLeft') x -= speed;
  if (e.key === 'ArrowRight') x += speed;

  if (players[myId]) {
    players[myId].x = x;
    players[myId].y = y;
    socket.emit('move', { x, y });
    draw();
  }
});

console.log("game.mjs loaded!");
