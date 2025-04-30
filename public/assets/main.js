function startGame(scene, state) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');

  storyDiv.textContent = scene.content;
  optionsDiv.innerHTML = '';

  scene.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;

    if (option.condition) {
      const { item, gold } = option.condition;
      if (item && !state.inventory[item]) {
        button.disabled = true;
        button.textContent += " (需要道具)";
      }
      if (gold && state.gold < gold) {
        button.disabled = true;
        button.textContent += ` (需要${gold}金币)`;
      }
    }

    button.onclick = () => {
      document.getElementById('option').value = option.text;
      document.getElementById('form').submit();
    };
    optionsDiv.appendChild(button);
  });
}


console.log(startGame)