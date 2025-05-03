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

  showState(state)
}

function showState(state) {
  const attr = document.querySelector('#profile .attr');
  const inventory = document.querySelector('#profile .inventory');

  attr.innerHTML = '';
  Object.entries(state.attrName).forEach(function([key, name]) { 
    const attrHTML = `<span class="name">${name}</span>
        <span class="value">${state.attr[key]}</span>`
    attr.innerHTML += `<div class="item">${attrHTML}</div>`;
  })

  inventory.innerHTML = '';
  state.inventory.forEach(function(item) { 
    const itemHTML = `<span class="name">${item.name}</span>
        <span class="value">x ${item.count}</span>`
    inventory.innerHTML += `<div class="item" title="${item.description}">${itemHTML}</div>`;
  })
}

function showMessage(message, type) {
  const messageCon = document.getElementById('message');
  messageCon.style.display = message ? 'block' : 'none';
  messageCon.className = 'message ' + type;
  messageCon.textContent = message;
}


console.log(startGame)