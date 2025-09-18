'use strict';

const bsert = require('bsert');
const DataManager = require('./DataManager');
const Player = require('./Player');

class GameServer {
  constructor(server, wss, db, logger) {
    this.server = server;
    this.wss = wss;
    this.db = db;
    this.logger = logger;
    this.players = new Map();

    this.init();
  }

  async init() {
    // Open database
    await this.db.open();
    this.logger.info('Database opened');

    // Load game data
    await DataManager.loadDatabase();

    // Setup HTTP routes
    this.setupRoutes();

    // Setup WebSocket events
    this.setupWebSocket();

    // Start server
    this.server.listen();
    this.logger.info('Server started on port %s', this.server.options.port);
  }

  setupRoutes() {
    // Serve static files
    this.server.use(this.server.router().static('public'));

    // API routes
    this.server.get('/api/actors', (req, res) => {
      res.json(DataManager.actors);
    });

    this.server.get('/api/items', (req, res) => {
      res.json(DataManager.items);
    });

    this.server.get('/api/maps', (req, res) => {
      res.json(DataManager.maps);
    });

    this.server.get('/api/player/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const data = await this.db.get(`player:${id}`);
        if (!data) {
          return res.json({ error: 'Player not found' });
        }
        res.json(JSON.parse(data.toString()));
      } catch (error) {
        this.logger.error('Error getting player:', error);
        res.json({ error: 'Failed to get player' });
      }
    });

    this.server.post('/api/player/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const playerData = req.body;
        await this.db.put(`player:${id}`, JSON.stringify(playerData));
        res.json({ success: true });
      } catch (error) {
        this.logger.error('Error saving player:', error);
        res.json({ error: 'Failed to save player' });
      }
    });

    this.server.post('/api/gold/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const { amount } = req.body;

        const data = await this.db.get(`player:${id}`);
        if (!data) {
          return res.json({ error: 'Player not found' });
        }

        const player = new Player().fromJSON(JSON.parse(data.toString()));
        player.gold += amount;

        await this.db.put(`player:${id}`, JSON.stringify(player));
        res.json({ success: true, gold: player.gold });
      } catch (error) {
        this.logger.error('Error updating gold:', error);
        res.json({ error: 'Failed to update gold' });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (socket) => {
      this.logger.info('Client connected');

      socket.on('join', (data) => {
        try {
          bsert.ok(data.id, 'Player ID required');
          bsert.ok(data.name, 'Player name required');

          const player = new Player(data.id, data.name);
          this.players.set(data.id, player);

          socket.join('game');
          socket.emit('joined', player.toJSON());
          socket.broadcast('player-joined', player.toJSON());

          this.logger.info('Player joined:', data.name);
        } catch (error) {
          this.logger.error('Error in join event:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('move', (data) => {
        try {
          bsert.ok(data.id, 'Player ID required');
          bsert.ok(data.position, 'Position required');

          const player = this.players.get(data.id);
          if (player) {
            player.position = data.position;
            socket.broadcast('player-moved', {
              id: data.id,
              position: data.position
            });
          }
        } catch (error) {
          this.logger.error('Error in move event:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('chat', (data) => {
        try {
          bsert.ok(data.id, 'Player ID required');
          bsert.ok(data.message, 'Message required');

          const player = this.players.get(data.id);
          if (player) {
            socket.broadcast('chat-message', {
              player: player.name,
              message: data.message
            });
          }
        } catch (error) {
          this.logger.error('Error in chat event:', error);
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('disconnect', () => {
        // Find player by socket and remove
        for (const [id, player] of this.players.entries()) {
          this.players.delete(id);
          socket.broadcast('player-left', { id });
          this.logger.info('Player left:', player.name);
          break;
        }
      });
    });

    // Attach WebSocket server to HTTP server
    this.server.on('upgrade', this.wss.handleUpgrade.bind(this.wss));
  }
}

module.exports = GameServer;
