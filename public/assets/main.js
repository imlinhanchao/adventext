function startGame(scene, state) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');
  document.getElementById('error').style.display = 'none';

  storyDiv.textContent = scene.content;
  optionsDiv.innerHTML = '';

  scene.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;

    if (option.append) {
      storyDiv.textContent += option.append;
    }

    button.onclick = () => {
      button.disabled = true;
      let value;
      if (option.value) {
        value = prompt(option.value)
        if (!value) return;
      }
      fetch('/choose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          option: option.text,
          value,
        })
      }).then(res => res.json())
        .then(res => {
          button.disabled = false;
          if (!res.code) {
            startGame(res.data.story, res.data.state);
          } else {
            document.getElementById('error').innerText = res.message;
            document.getElementById('error').style.display = 'block';
          }
        });
    };
    optionsDiv.appendChild(button);
  });
}


console.log(startGame)