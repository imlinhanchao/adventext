let gameState = { currentScene: "start", inventory: {}, gold: 0 };

class Game {
  constructor() {

  }

  async init() {
    this.user = await this.getUserInfo();
  }
  
  async getUserInfo() {
    try {
      const response = await fetch('/user-info');
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      const userInfo = await response.json();
      console.log('User Info:', userInfo);
      return userInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  }
}

async function loadStory() {
  const response = await fetch('/stories');
  return response.json();
}

function renderScene(story, sceneId) {
  const scene = story[sceneId];
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');

  storyDiv.textContent = scene.text;
  optionsDiv.innerHTML = '';

  scene.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;

    // 检查条件
    if (option.condition) {
      const { item, gold } = option.condition;
      if (item && !gameState.inventory[item]) {
        button.disabled = true;
        button.textContent += " (需要道具)";
      }
      if (gold && gameState.gold < gold) {
        button.disabled = true;
        button.textContent += ` (需要${gold}金币)`;
      }
    }

    button.onclick = () => {
      // 应用效果
      if (option.effect) {
        const { item, gold } = option.effect;
        if (item) gameState.inventory[item] = true;
        if (gold) gameState.gold += gold;
      }

      gameState.currentScene = option.next;
      renderScene(story, gameState.currentScene);
    };
    optionsDiv.appendChild(button);
  });
}

(async function startGame() {
  const story = await loadStory();
  renderScene(story, gameState.currentScene);
})();