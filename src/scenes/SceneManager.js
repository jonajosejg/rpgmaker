class SceneManager {
  constructor() {
    this.currentScene = null;
    this.scenes = new Map();
  }

  addScene(name, scene) {
    this.scenes.set(name, scene);
  }

  changeScene(name) {
    if (this.currentScene) {
      this.currentScene.destroy();
    }

    const newScene = this.scenes.get(name);
    if (newScene) {
      this.currentScene = newScene;
      this.currentScene.init();
    } else {
      console.error(`Scene ${name} not found`);
    }
  }

  update() {
    if (this.currentScene) {
      this.currentScene.update();
    }
  }

  render() {
    if (this.currentScene) {
      this.currentScene.render();
    }
  }
}

module.exports = SceneManager;
