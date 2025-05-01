function startGame(scene, state) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');
  showMessage('', 'info')

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
      fetch('/choose/' + story, {
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
            startGame(res.data.scene, res.data.state);
            showMessage(res.data.message, 'info')
          } else {
            showMessage(res.message, 'error')
          }
        });
    };
    optionsDiv.appendChild(button);
  });
}

function showMessage(message, type) {
  const messageCon = document.getElementById('message');
  messageCon.style.display = message ? 'block' : 'none';
  messageCon.className = 'message ' + type;
  messageCon.textContent = message;
}


console.log(startGame)