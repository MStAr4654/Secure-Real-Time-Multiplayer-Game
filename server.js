require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Set correct headers manually for FCC
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.hidePoweredBy({ setTo: 'PHP 7.4.3' }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('X-Powered-By', 'PHP/7.4.3');
  next();
});


app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);
    
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});
const io = socketio(server);

module.exports = app; // For testing

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
