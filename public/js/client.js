// Game client implementation
class GameClient {
    constructor() {
        this.app = null;
        this.socket = null;
        this.player = null;
        this.otherPlayers = new Map();
        this.gameState = {
            playerId: 'player_' + Math.random().toString(36).substr(2, 9),
            playerName: 'Adventurer',
            level: 1,
            hp: 50,
            maxHp: 50,
            mp: 30,
            maxMp: 30,
            gold: 100,
            position: { x: 10, y: 10 },
            currentMap: 1
        };

        this.keys = {};
        this.loadingProgress = 0;
        this.isChatMinimized = false;

        this.init();
    }

    init() {
        // Initialize PIXI application
        this.setupPIXI();

        // Connect to server
        this.connectToServer();

        // Setup event listeners
        this.setupEventListeners();

        // Start loading assets
        this.loadAssets();
    }

    setupPIXI() {
        // Create PIXI application
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1a1a2e,
            antialias: true
        });

        // Add canvas to game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.view);

        // Create container for game world
        this.world = new PIXI.Container();
        this.app.stage.addChild(this.world);
    }

    connectToServer() {
        // Connect to WebSocket server
        this.socket = io();

        // Setup socket event handlers
        this.socket.on('connect', () => {
            console.log('Connected to server');

            // Join game
            this.socket.emit('join', {
                id: this.gameState.playerId,
                name: this.gameState.playerName
            });
        });

        this.socket.on('joined', (playerData) => {
            console.log('Joined game:', playerData);
            this.updatePlayerData(playerData);
            this.hideLoadingScreen();
        });

        this.socket.on('player-joined', (playerData) => {
            console.log('Player joined:', playerData);
            this.addOtherPlayer(playerData);
        });

        this.socket.on('player-moved', (data) => {
            this.moveOtherPlayer(data.id, data.position);
        });

        this.socket.on('player-left', (data) => {
            this.removeOtherPlayer(data.id);
        });

        this.socket.on('chat-message', (data) => {
            this.addChatMessage(data.player, data.message);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.showMessage('Disconnected from server. Attempting to reconnect...');
        });
    }

    setupEventListeners() {
        // Keyboard input
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            // Toggle menu with Escape key
            if (e.key === 'Escape') {
                this.toggleMenu();
            }

            // Open chat with Enter key
            if (e.key === 'Enter') {
                const chatInput = document.getElementById('chat-input');
                if (document.activeElement !== chatInput) {
                    chatInput.focus();
                    e.preventDefault();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Button handlers
        document.getElementById('btn-heal').addEventListener('click', () => {
            this.healPlayer();
        });

        document.getElementById('btn-level').addEventListener('click', () => {
            this.levelUpPlayer();
        });

        document.getElementById('btn-inventory').addEventListener('click', () => {
            this.showMessage('Inventory feature coming soon!');
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveGame();
        });

        document.getElementById('btn-send-chat').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        document.getElementById('btn-toggle-chat').addEventListener('click', () => {
            this.toggleChat();
        });

        // Menu button handlers
        document.getElementById('btn-resume').addEventListener('click', () => {
            this.toggleMenu();
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('btn-load-game').addEventListener('click', () => {
            this.loadGame();
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            this.showMessage('Settings feature coming soon!');
        });

        document.getElementById('btn-exit').addEventListener('click', () => {
            this.exitGame();
        });

        // Setup game loop
        this.setupGameLoop();
    }

    setupGameLoop() {
        // Game loop
        this.app.ticker.add(() => {
            this.updatePlayerMovement();
        });
    }

    updatePlayerMovement() {
        if (!this.player) return;

        let moved = false;
        let newX = this.player.x;
        let newY = this.player.y;
        const moveSpeed = 2;

        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            newY -= moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            newY += moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            newX -= moveSpeed;
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            newX += moveSpeed;
            moved = true;
        }

        // Boundary checking
        newX = Math.max(0, Math.min(this.app.screen.width - 32, newX));
        newY = Math.max(0, Math.min(this.app.screen.height - 32, newY));

        // Update position if moved
        if (moved) {
            this.player.x = newX;
            this.player.y = newY;

            // Update game state
            this.gameState.position.x = Math.round(newX / 32);
            this.gameState.position.y = Math.round(newY / 32);

            // Send movement to server
            this.socket.emit('move', {
                id: this.gameState.playerId,
                position: this.gameState.position
            });
        }
    }

    loadAssets() {
        // Simulate asset loading
        const totalAssets = 10;
        const interval = setInterval(() => {
            this.loadingProgress += 10;
            document.querySelector('.progress').style.width = `${this.loadingProgress}%`;

            if (this.loadingProgress >= 100) {
                clearInterval(interval);
                this.createGameWorld();
            }
        }, 200);
    }

    createGameWorld() {
        const tileSize = 32;
        const mapWidth = 25;
        const mapHeight = 19;

        // Create tiles
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tile = new PIXI.Graphics();

                // Draw grass
                tile.beginFill(0x2e8b57);
                tile.drawRect(0, 0, tileSize, tileSize);
                tile.endFill();

                // Add some details to grass
                tile.beginFill(0x228b22);
                if ((x + y) % 3 === 0) {
                    tile.drawCircle(8, 8, 2);
                }
                if ((x + y) % 4 === 0) {
                    tile.drawCircle(24, 20, 2);
                }
                if ((x + y) % 5 === 0) {
                    tile.drawCircle(16, 28, 2);
                }
                tile.endFill();

                tile.x = x * tileSize;
                tile.y = y * tileSize;
                this.world.addChild(tile);
            }
        }

        // Draw a path
        for (let x = 5; x < 20; x++) {
            for (let y = 5; y < 14; y++) {
                const pathTile = new PIXI.Graphics();
                pathTile.beginFill(0xa9a9a9);
                pathTile.drawRect(0, 0, tileSize, tileSize);
                pathTile.endFill();

                // Add path details
                pathTile.beginFill(0x808080);
                if ((x + y) % 2 === 0) {
                    pathTile.drawRect(0, 0, tileSize, 2);
                    pathTile.drawRect(0, 0, 2, tileSize);
                } else {
                    pathTile.drawRect(tileSize - 2, 0, 2, tileSize);
                    pathTile.drawRect(0, tileSize - 2, tileSize, 2);
                }
                pathTile.endFill();

                pathTile.x = x * tileSize;
                pathTile.y = y * tileSize;
                this.world.addChild(pathTile);
            }
        }

        // Create player character
        this.player = new PIXI.Graphics();
        this.player.beginFill(0xff6b6b);
        this.player.drawRect(0, 0, tileSize, tileSize);
        this.player.endFill();

        // Add details to player
        this.player.beginFill(0x8ce0ff);
        this.player.drawRect(8, 4, 16, 8); // Eyes
        this.player.drawRect(4, 20, 24, 8); // Body
        this.player.endFill();

        this.player.x = 10 * tileSize;
        this.player.y = 10 * tileSize;
        this.world.addChild(this.player);

        // Create some NPCs
        const npcColors = [0xffd166, 0x06d6a0, 0x118ab2];
        const npcPositions = [
            {x: 7, y: 7},
            {x: 15, y: 7},
            {x: 12, y: 12}
        ];

        for (let i = 0; i < 3; i++) {
            const npc = new PIXI.Graphics();
            npc.beginFill(npcColors[i]);
            npc.drawRect(0, 0, tileSize, tileSize);
            npc.endFill();

            // Add details to NPC
            npc.beginFill(0xffffff);
            npc.drawRect(8, 4, 16, 8); // Eyes
            npc.drawRect(4, 20, 24, 8); // Body
            npc.endFill();

            npc.x = npcPositions[i].x * tileSize;
            npc.y = npcPositions[i].y * tileSize;
            this.world.addChild(npc);
        }

        // Create obstacles (trees)
        const treePositions = [
            {x: 3, y: 3},
            {x: 20, y: 3},
            {x: 3, y: 15},
            {x: 20, y: 15}
        ];

        for (const pos of treePositions) {
            const tree = new PIXI.Graphics();

            // Tree trunk
            tree.beginFill(0x8b4513);
            tree.drawRect(12, 20, 8, 12);
            tree.endFill();

            // Tree leaves
            tree.beginFill(0x2e8b57);
            tree.drawEllipse(16, 10, 12, 16);
            tree.endFill();

            tree.x = pos.x * tileSize;
            tree.y = pos.y * tileSize;
            this.world.addChild(tree);
        }

        // Add a house
        const house = new PIXI.Graphics();
        house.beginFill(0xd1495b);
        house.drawRect(0, 0, tileSize * 3, tileSize * 2);
        house.endFill();

        // Roof
        house.beginFill(0x8c2f39);
        house.moveTo(0, 0);
        house.lineTo(tileSize * 3, 0);
        house.lineTo(tileSize * 1.5, -tileSize);
        house.lineTo(0, 0);
        house.endFill();

        // Door
        house.beginFill(0x8b4513);
        house.drawRect(tileSize, tileSize, tileSize, tileSize);
        house.endFill();

        house.x = 18 * tileSize;
        house.y = 2 * tileSize;
        this.world.addChild(house);

        // Add title
        const title = new PIXI.Text('RPG Maker MZ-inspired Demo', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xe6b89c,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 2
        });
        title.x = this.app.screen.width / 2 - title.width / 2;
        title.y = 10;
        this.app.stage.addChild(title);

        // Add instructions
        const instructions = new PIXI.Text('Use arrow keys or WASD to move', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        instructions.x = this.app.screen.width / 2 - instructions.width / 2;
        instructions.y = this.app.screen.height - 30;
        this.app.stage.addChild(instructions);
    }

    hideLoadingScreen() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        document.getElementById('ui-container').style.display = 'block';
        document.getElementById('chat-container').style.display = 'block';

        this.updateUI();
    }

    updateUI() {
        document.getElementById('level').textContent = this.gameState.level;
        document.getElementById('hp').textContent = this.gameState.hp;
        document.getElementById('max-hp').textContent = this.gameState.maxHp;
        document.getElementById('mp').textContent = this.gameState.mp;
        document.getElementById('max-mp').textContent = this.gameState.maxMp;
        document.getElementById('gold').textContent = this.gameState.gold;
    }

    updatePlayerData(playerData) {
        this.gameState = { ...this.gameState, ...playerData };
        this.updateUI();
    }

    addOtherPlayer(playerData) {
        const tileSize = 32;
        const otherPlayer = new PIXI.Graphics();
        otherPlayer.beginFill(0x94d2bd);
        otherPlayer.drawRect(0, 0, tileSize, tileSize);
        otherPlayer.endFill();

        // Add details to other player
        otherPlayer.beginFill(0xffffff);
        otherPlayer.drawRect(8, 4, 16, 8); // Eyes
        otherPlayer.drawRect(4, 20, 24, 8); // Body
        otherPlayer.endFill();

        otherPlayer.x = playerData.position.x * tileSize;
        otherPlayer.y = playerData.position.y * tileSize;
        this.world.addChild(otherPlayer);

        this.otherPlayers.set(playerData.id, otherPlayer);

        // Add player name label
        const nameText = new PIXI.Text(playerData.name, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xffffff
        });
        nameText.x = otherPlayer.x + (tileSize / 2) - (nameText.width / 2);
        nameText.y = otherPlayer.y - 15;
        this.world.addChild(nameText);

        // Store reference to name text
        otherPlayer.nameText = nameText;
    }

    moveOtherPlayer(playerId, position) {
        const tileSize = 32;
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            otherPlayer.x = position.x * tileSize;
            otherPlayer.y = position.y * tileSize;

            // Update name position
            if (otherPlayer.nameText) {
                otherPlayer.nameText.x = otherPlayer.x + (tileSize / 2) - (otherPlayer.nameText.width / 2);
                otherPlayer.nameText.y = otherPlayer.y - 15;
            }
        }
    }

    removeOtherPlayer(playerId) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            this.world.removeChild(otherPlayer);
            if (otherPlayer.nameText) {
                this.world.removeChild(otherPlayer.nameText);
            }
            this.otherPlayers.delete(playerId);
        }
    }

    addChatMessage(player, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${player}:</strong> ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();

        if (message) {
            this.socket.emit('chat', {
                id: this.gameState.playerId,
                message: message
            });

            chatInput.value = '';
        }

        // Return focus to game
        chatInput.blur();
    }

    toggleChat() {
        const chatContainer = document.getElementById('chat-container');
        this.isChatMinimized = !this.isChatMinimized;

        if (this.isChatMinimized) {
            chatContainer.classList.add('chat-minimized');
            document.getElementById('btn-toggle-chat').textContent = '+';
        } else {
            chatContainer.classList.remove('chat-minimized');
            document.getElementById('btn-toggle-chat').textContent = '−';
        }
    }

    toggleMenu() {
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer.style.display === 'none') {
            menuContainer.style.display = 'flex';
        } else {
            menuContainer.style.display = 'none';
        }
    }

    healPlayer() {
        if (this.gameState.gold >= 10 && this.gameState.hp < this.gameState.maxHp) {
            this.gameState.gold -= 10;
            this.gameState.hp = Math.min(this.gameState.hp + 10, this.gameState.maxHp);
            this.updateUI();

            // Update server
            fetch(`/api/gold/${this.gameState.playerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: -10 })
            });

            this.showMessage('Healed for 10 HP!');
        }
    }

    levelUpPlayer() {
        if (this.gameState.gold >= 50) {
            this.gameState.gold -= 50;
            this.gameState.level += 1;
            this.gameState.maxHp += 10;
            this.gameState.maxMp += 5;
            this.gameState.hp = this.gameState.maxHp;
            this.gameState.mp = this.gameState.maxMp;
            this.updateUI();

            // Update server
            fetch(`/api/gold/${this.gameState.playerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: -50 })
            });

            this.showMessage('Level up! You are now level ' + this.gameState.level);
        }
    }

    saveGame() {
        fetch(`/api/player/${this.gameState.playerId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.gameState)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showMessage('Game saved successfully!');
            } else {
                this.showMessage('Failed to save game.');
            }
        })
        .catch(error => {
            console.error('Error saving game:', error);
            this.showMessage('Error saving game.');
        });
    }

    loadGame() {
        fetch(`/api/player/${this.gameState.playerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                this.showMessage('No saved game found.');
            } else {
                this.updatePlayerData(data);
                this.showMessage('Game loaded successfully!');
            }
        })
        .catch(error => {
            console.error('Error loading game:', error);
            this.showMessage('Error loading game.');
        });
    }

    newGame() {
        if (confirm('Start a new game? All progress will be lost.')) {
            this.gameState = {
                playerId: 'player_' + Math.random().toString(36).substr(2, 9),
                playerName: 'Adventurer',
                level: 1,
                hp: 50,
                maxHp: 50,
                mp: 30,
                maxMp: 30,
                gold: 100,
                position: { x: 10, y: 10 },
                currentMap: 1
            };

            // Rejoin with new player ID
            this.socket.emit('join', {
                id: this.gameState.playerId,
                name: this.gameState.playerName
            });

            this.toggleMenu();
            this.showMessage('New game started!');
        }
    }

    exitGame() {
        if (confirm('Are you sure you want to exit?')) {
            window.close();
        }
    }

    showMessage(message) {
        // Create temporary message display
        const messageElement = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center',
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowDistance: 2
        });

        messageElement.x = this.app.screen.width / 2 - messageElement.width / 2;
        messageElement.y = this.app.screen.height / 2 - 50;
        this.app.stage.addChild(messageElement);

        // Remove message after delay
        setTimeout(() => {
            this.app.stage.removeChild(messageElement);
        }, 3000);
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new GameClient();
});
