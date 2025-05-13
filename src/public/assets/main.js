function startGame(scene, state) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');
  showMessage('', 'info')

  Object.entries(state.attr).forEach(([key, value]) => {
    if (scene.content.includes(`\${${key}}`)) {
      scene.content = scene.content.replaceAll(`\${${key}}`, value);
    }
  });

  storyDiv.textContent = scene.content;
  optionsDiv.innerHTML = '';

  if (scene.isEnd) {
    showMessage(`收获结局：${scene.theEnd}`, 'success')
    const button = document.createElement('button');
    button.textContent = '重新开始';
    button.onclick = async () => {
      button.disabled = true;
      fetch(`./${story}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({})
      }).then(res => res.json())
        .then(res => {
          button.disabled = false;
          if (!res.code) {
            location.reload();
          } else {
            showMessage(res.message, 'error')
          }
        });
    };
    optionsDiv.appendChild(button);
  } else {
    scene.options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;

      if (option.append) {
        if (storyDiv.textContent.includes('${' + option.text + '}')) {
          storyDiv.textContent = storyDiv.textContent.replaceAll('${' + option.text + '}', option.append);
        } else {
          storyDiv.textContent += option.append;
        }
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
        fetch(`./${window.storyId}/choose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            option: option.text,
            value,
            timezone: new Date().getTimezoneOffset() / -60
          })
        }).then(res => res.json())
          .then(res => {
            button.disabled = false;
            if (!res.code) {
              startGame(res.data.scene, res.data.state);
              if (res.data.message) showMessage(res.data.message, 'info')
            } else {
              showMessage(res.message, 'error')
            }
          });
      };
      optionsDiv.appendChild(button);
    });
  }

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
  Object.entries(state.attrName).forEach(function ([key, name]) {
    const attrHTML = `<span class="name">${name}</span>
        <span class="value">${state.attr[key]}</span>`
    attr.innerHTML += `<div class="item">${attrHTML}</div>`;
  })

  document.getElementById('attr').style.display = Object.keys(state.attrName).length == 0 ? 'none' : 'block';

  inventory.innerHTML = '';
  state.inventory.forEach(function (item) {
    const itemHTML = `<span class="name">${item.name}</span>
        <span class="value">x ${item.count}</span>`
    inventory.innerHTML += `<div class="item" title="${item.description}">${itemHTML}</div>`;
  })

  document.getElementById('item').style.display = state.inventory.length == 0 ? 'none' : 'block';
}

function showMessage(message, type) {
  const messageCon = document.getElementById('message');
  messageCon.style.display = message ? 'block' : 'none';
  messageCon.className = 'message ' + type;
  messageCon.textContent = message;
}

function initGame(story) {
  window.storyId = story;
  fetch(`./${story}/init`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      timezone: new Date().getTimezoneOffset() / -60
    })
  }).then(res => res.json())
    .then(res => {
      if (!res.code) {
        startGame(res.data.scene, res.data.state);
      } else {
        showMessage(res.message, 'error')
      }
    });
}

const isDarkModeInSystem = window.matchMedia("(prefers-color-scheme: dark)").matches;

function initDarkMode() {
  const body = document.body;
  const darkMode = localStorage.getItem('vueuse-color-scheme') || 'auto';
  switch (darkMode) {
    case 'dark': 
      body.classList.add('dark');
      localStorage.setItem('dark-mode', 'true');
      break;
    case 'auto':
      if (isDarkModeInSystem) {
        body.classList.add('dark');
        localStorage.setItem('dark-mode', 'true');
      }
      break;
  }
}

function toggleDarkMode() {
  const body = document.body;
  let darkMode = localStorage.getItem('vueuse-color-scheme'); // light / dark / auto
  if (darkMode === 'dark') {
    body.classList.remove('dark');
    localStorage.setItem('vueuse-color-scheme', isDarkModeInSystem ? 'light' : 'auto');
  } else if (darkMode === 'light') {
    body.classList.add('dark');
    localStorage.setItem('vueuse-color-scheme', !isDarkModeInSystem ? 'dark' : 'auto');
  } else {
    !isDarkModeInSystem ? body.classList.add('dark') : body.classList.remove('dark');
    localStorage.setItem('vueuse-color-scheme', isDarkModeInSystem ? 'light' : 'dark');
  }
}

