require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const io = require('socket.io')(server);

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

// ✅ Set cache-control headers for all responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// ✅ Helmet setup per FCC requirements
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));

app.use('/public', express.static(process.cwd() + '/public', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));
app.use('/assets', express.static(process.cwd() + '/assets', {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store');
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Allow cross-origin requests for FCC test tool
app.use(cors({ origin: '*' }));

// ✅ Set cache headers here too
app.route('/')
  .get(function (req, res) {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(process.cwd() + '/views/index.html');
  });

fccTestingRoutes(app);

// 404 handler
app.use(function (req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(() => {
      try {
        runner.run();
      } catch (err) {
        console.log('Tests are not valid:');
        console.error(err);
      }
    }, 1500);
  }
});

module.exports = app;


const players = {};
let collectible = {
  x: Math.floor(Math.random() * 500),
  y: Math.floor(Math.random() * 500)
};

io.on('connection', socket => {
  console.log(`Player connected: ${socket.id}`);

  // Initialize player
  players[socket.id] = {
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500),
    score: 0
  };

  // Send initial game state to this player
  socket.emit('init', {
    id: socket.id,
    players,
    collectible
  });

  // Inform other players about the new player
  socket.broadcast.emit('new-player', {
    id: socket.id,
    player: players[socket.id]
  });

  // Handle player movement
  socket.on('move', ({ x, y }) => {
    if (!players[socket.id]) return;

    players[socket.id].x = x;
    players[socket.id].y = y;

    // Check for collision with collectible
    const dx = x - collectible.x;
    const dy = y - collectible.y;

    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      players[socket.id].score += 1;

      // Move collectible to a new random location
      collectible = {
        x: Math.floor(Math.random() * 500),
        y: Math.floor(Math.random() * 500)
      };

      // Notify all players about new collectible and updated score
      io.emit('collected', {
        id: socket.id,
        score: players[socket.id].score,
        collectible
      });
    }

    // Broadcast updated player position
    socket.broadcast.emit('player-moved', {
      id: socket.id,
      x,
      y
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('player-disconnected', socket.id);
  });
});

/*


// Your Socket.io logic
io.on('connection', socket => {
  console.log('Player connected:', socket.id);

  // Initialize player
  players[socket.id] = {
    x: Math.floor(Math.random() * 500),
    y: Math.floor(Math.random() * 500),
    score: 0
  };

  // Send initial game state
  socket.emit('init', {
    id: socket.id,
    players,
    collectible
  });

  // Notify others
  socket.broadcast.emit('new-player', {
    id: socket.id,
    player: players[socket.id]
  });

  // Handle player move
  socket.on('move', ({ x, y }) => {
    if (players[socket.id]) {
      players[socket.id].x = x;
      players[socket.id].y = y;

      // Check collectible collision
      const dx = players[socket.id].x - collectible.x;
      const dy = players[socket.id].y - collectible.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 20) {
        players[socket.id].score += 1;
        collectible = {
          x: Math.floor(Math.random() * 500),
          y: Math.floor(Math.random() * 500)
        };
        io.emit('collected', {
          id: socket.id,
          collectible,
          score: players[socket.id].score
        });
      }

      socket.broadcast.emit('player-moved', {
        id: socket.id,
        x,
        y
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    delete players[socket.id];
    socket.broadcast.emit('player-disconnected', socket.id);
  });
});

*/