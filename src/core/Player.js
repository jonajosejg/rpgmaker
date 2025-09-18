'use strict';

class Player {
  constructor(id, name) {
    this.id = id || 'unknown';
    this.name = name || 'Player';
    this.level = 1;
    this.hp = 100;
    this.maxHp = 100;
    this.mp = 50;
    this.maxMp = 50;
    this.gold = 100;
    this.position = { x: 10, y: 10 };
    this.inventory = new Map();
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
    this.skills = [];
    this.currentMap = 1;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      level: this.level,
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      gold: this.gold,
      position: this.position,
      inventory: Array.from(this.inventory.entries()),
      equipment: this.equipment,
      skills: this.skills,
      currentMap: this.currentMap
    };
  }

  fromJSON(data) {
    this.id = data.id;
    this.name = data.name;
    this.level = data.level;
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    this.mp = data.mp;
    this.maxMp = data.maxMp;
    this.gold = data.gold;
    this.position = data.position;
    this.inventory = new Map(data.inventory || []);
    this.equipment = data.equipment || {
      weapon: null,
      armor: null,
      accessory: null
    };
    this.skills = data.skills || [];
    this.currentMap = data.currentMap || 1;
    return this;
  }

  addItem(itemId, quantity = 1) {
    const current = this.inventory.get(itemId) || 0;
    this.inventory.set(itemId, current + quantity);
  }

  removeItem(itemId, quantity = 1) {
    const current = this.inventory.get(itemId) || 0;
    if (current <= quantity) {
      this.inventory.delete(itemId);
    } else {
      this.inventory.set(itemId, current - quantity);
    }
  }

  useItem(itemId) {
    this.removeItem(itemId, 1);
    // Implement item effects here
  }

  equipItem(itemId, slot) {
    if (this.equipment[slot]) {
      this.addItem(this.equipment[slot].id, 1);
    }
    this.equipment[slot] = { id: itemId };
    this.removeItem(itemId, 1);
  }

  levelUp() {
    this.level += 1;
    this.maxHp += 10;
    this.maxMp += 5;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
  }
}

module.exports = Player;
