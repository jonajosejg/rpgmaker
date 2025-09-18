'use strict';

const bweb = require('bweb');
const bsock = require('bsock');
const bsert = require('bsert');
const blogger = require('blogger');
const bdb = require('bdb');
const bfile = require('bfile');
const path = require('path');

// Initialize logger
const logger = blogger.create('rpg-server', {
  level: 'debug',
  color: true
});

// Create WebSocket server
const wss = bsock.server();

// Create HTTP server
const server = bweb.server({
  port: process.env.PORT || 3000,
  ssl: false
});

// Initialize database
const db = bdb.create({
  location: path.join(__dirname, 'data'),
  memory: false,
  compression: true
});

// Import game classes
const GameServer = require('./src/core/GameServer');

// Initialize game server
const gameServer = new GameServer(server, wss, db, logger);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');

  // Save all player data
  for (const [id, player] of gameServer.players.entries()) {
    await db.put(`player:${id}`, JSON.stringify(player.toJSON()));
  }

  await db.close();
  server.close();
  process.exit(0);
});

module.exports = server;
