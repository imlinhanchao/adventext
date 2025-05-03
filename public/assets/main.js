
function startGame(scene, state) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');
  showMessage('', 'info')

  if (scene.isEnd) {
    showMessage(`收获结局：${scene.theEnd}`, 'success')
  }

  storyDiv.textContent = scene.content;
  optionsDiv.innerHTML = '';

  scene.options.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.text;

    if (option.append) {
      storyDiv.textContent += option.append;
    }

    button.onclick = async () => {
      button.disabled = true;
      let value;
      if (option.value?.startsWith('item:')) {
        const [_, message, type] = option.value.split(':');
        let inventory = state.inventory.filter(item => item.count > 0);
        if (type) inventory = inventory.filter(item => item.type === type);
        if (inventory.length === 0) {
          showMessage(type ? `你没有${type}` : '先去别处转转吧', 'error')
          return;
        }
        value = await selectItem(inventory, message).catch(() => {
          button.disabled = false
        });
        if (!value) return;
      } else if (option.value) {
        value = prompt(option.value)
        if (!value) return;
      }
      fetch(`/${story}/choose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          option: option.text,
          value,
          timezone: new Date().getTimezoneOffset() / 60
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

function selectItem(inventory, message) {
  return new Promise((resolve, reject) => {
    const cancel = document.getElementById('dialog-cancel');
    const content = document.getElementById('dialog-content');
    const dialog = document.getElementById('dialog');
    cancel.onclick = () => {
      dialog.style.visibility = 'hidden';
      reject();
    };
    dialog.style.visibility = 'visible';

    const itemChoose = [];
    const itemList = document.createElement('div');
    itemList.className = 'item-list';
    inventory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item cursor-pointer';
      itemDiv.textContent = `${item.name}`;
      itemDiv.onclick = () => {
        if (itemChoose.includes(item)) {
          itemChoose.splice(itemChoose.indexOf(item), 1);
          itemDiv.classList.remove('selected');
        } else {
          itemChoose.push(item);
          itemDiv.classList.add('selected');
        }
        resolve(`item:${item.key}`);
        dialog.style.visibility = 'hidden';
      };
      itemList.appendChild(itemDiv);
    });

    content.innerHTML = `<p>${message}</p>`
    content.appendChild(itemList);
  });
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