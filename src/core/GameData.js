'use strict';

const bfile = require('bfile');
const path = require('path');

class GameData {
  constructor() {
    this.actors = new Map();
    this.items = new Map();
    this.maps = new Map();
    this.skills = new Map();
    this.enemies = new Map();
    this.npcs = new Map();
  }

  async load() {
    try {
      // Load actors
      const actorData = await bfile.readFile(path.join(__dirname, '../../data/actors.json'), 'utf8');
      JSON.parse(actorData).forEach(actor => {
        this.actors.set(actor.id, actor);
      });

      // Load items
      const itemData = await bfile.readFile(path.join(__dirname, '../../data/items.json'), 'utf8');
      JSON.parse(itemData).forEach(item => {
        this.items.set(item.id, item);
      });

      // Load maps
      const mapData = await bfile.readFile(path.join(__dirname, '../../data/maps.json'), 'utf8');
      JSON.parse(mapData).forEach(map => {
        this.maps.set(map.id, map);
      });

      // Load skills
      const skillData = await bfile.readFile(path.join(__dirname, '../../data/skills.json'), 'utf8');
      JSON.parse(skillData).forEach(skill => {
        this.skills.set(skill.id, skill);
      });

      // Load enemies
      const enemyData = await bfile.readFile(path.join(__dirname, '../../data/enemies.json'), 'utf8');
      JSON.parse(enemyData).forEach(enemy => {
        this.enemies.set(enemy.id, enemy);
      });

      // Load NPCs
      const npcData = await bfile.readFile(path.join(__dirname, '../../data/npcs.json'), 'utf8');
      JSON.parse(npcData).forEach(npc => {
        this.npcs.set(npc.id, npc);
      });

      console.log('Game data loaded successfully');
    } catch (error) {
      console.error('Failed to load game data:', error);
    }
  }

  getActor(id) {
    return this.actors.get(id);
  }

  getItem(id) {
    return this.items.get(id);
  }

  getMap(id) {
    return this.maps.get(id);
  }

  getSkill(id) {
    return this.skills.get(id);
  }

  getEnemy(id) {
    return this.enemies.get(id);
  }

  getNPC(id) {
    return this.npcs.get(id);
  }
}

module.exports = GameData;
