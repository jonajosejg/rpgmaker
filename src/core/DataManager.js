'use strict';

const assert = require('bsert');
const bfile = require('bfile');
const path = require('path');

class DataManager {
  static async loadDatabase() {
    try {
      // Load actors
      const actorData = await bfile.readFile(path.join(__dirname, '../../data/actors.json'), 'utf8');
      this.actors = JSON.parse(actorData);

      // Load items
      const itemData = await bfile.readFile(path.join(__dirname, '../../data/items.json'), 'utf8');
      this.items = JSON.parse(itemData);

      // Load maps
      const mapData = await bfile.readFile(path.join(__dirname, '../../data/maps.json'), 'utf8');
      this.maps = JSON.parse(mapData);

      // Load skills
      const skillData = await bfile.readFile(path.join(__dirname, '../../data/skills.json'), 'utf8');
      this.skills = JSON.parse(skillData);

      // Load enemies
      const enemyData = await bfile.readFile(path.join(__dirname, '../../data/enemies.json'), 'utf8');
      this.enemies = JSON.parse(enemyData);

      // Load npcs
      const npcData = await bfile.readFile(path.join(__dirname, '../../data/npcs.json'), 'utf8');
      this.npcs = JSON.parse(npcData);

      console.log('Database loaded successfully');
    } catch (error) {
      console.error('Failed to load database:', error);
      // Create empty arrays if files don't exist
      this.actors = [];
      this.items = [];
      this.maps = [];
      this.skills = [];
      this.enemies = [];
      this.npcs = [];
    }
  }

  static getActor(id) {
    return this.actors.find(actor => actor.id === id);
  }

  static getItem(id) {
    return this.items.find(item => item.id === id);
  }

  static getMap(id) {
    return this.maps.find(map => map.id === id);
  }

  static getSkill(id) {
    return this.skills.find(skill => skill.id === id);
  }

  static getEnemy(id) {
    return this.enemies.find(enemy => enemy.id === id);
  }

  static getNPC(id) {
    return this.npcs.find(npc => npc.id === id);
  }
}

module.exports = DataManager;
