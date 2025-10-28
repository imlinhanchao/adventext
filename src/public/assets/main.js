let lock = false;
async function chooseOption(option, state, global=false) {
  if (lock) return;
  let value;
  if (option.value?.startsWith('item:') || option.value?.startsWith('items:')) {
    const [_, message, type] = option.value.split(':');
    const types = type ? type.split(',') : [];
    let inventory = state.inventory.filter(item => item.count > 0);
    if (type) inventory = inventory.filter(item => types.includes(item.type));
    if (inventory.length === 0) {
      showMessage(type ? `你没有${type}` : '先去别处转转吧', 'error')
      return;
    }
    value = await selectItem(inventory, message, option.value?.startsWith('items:')).catch(() => {
      this.disabled = false
    });
    if (!value) return;
  } else if (option.value) {
    value = prompt(option.value)
    if (!value) return;
  }
  lock = true;
  fetch(`./${window.storyId}/choose`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      option: option.text,
      value,
      timezone: new Date().getTimezoneOffset() / -60,
      global,
    })
  }).then(res => res.json())
    .then(res => {
      this.disabled = false;
      if (!res.code) {
        const { scene, state, content, message, global } = res.data;
        startGame(scene, state, content, global);
        if (message) showMessage(message, 'info')
      } else {
        showMessage(res.message, 'error')
      }
    }).finally(() => lock = false);
}

function splitContent(input) {
  const parts = input.split(/<((?:line|block|normal))\s*\/>/);
  const result = [];
  let prevMarker = 'normal';
  for (let i = 0; i < parts.length; i += 2) {
    const text = parts[i];
    result.push({ text, marker: prevMarker });
    prevMarker = parts[i + 1] || null;
  }
  return result;
}


function renderContent(content) {
  document.getElementById('action-tip').style.display = 'block';
  return new Promise(async (resolve) => {
    const storyDiv = document.getElementById('story');
    storyDiv.innerHTML = '';
    const contentParts = splitContent(content);
    function renderContentBlock({ text, marker }, content) {
      return new Promise((resolve) => {
        if (marker === 'normal') {
          content += text;
          storyDiv.innerHTML = DOMPurify.sanitize(marked?.parse(content) || content);
          delete document.body.onclick;
          resolve(content);
        } else if (marker === 'line') {
          const lines = text.split('\n').filter(line => line.trim() !== '');
          let index = 0;
          hotkeys.deleteScope('render');
          hotkeys('Space', 'render', () => {
            renderNextLine();
          });
          hotkeys.setScope('render');
          document.body.onclick = () => renderNextLine();
          renderNextLine();
          function renderNextLine() {
            if (index < lines.length) {
              content += lines[index] + '\n';
              storyDiv.innerHTML = DOMPurify.sanitize(marked?.parse(content) || content);
              index++;
            } else {
              hotkeys.deleteScope('render');
              resolve(content);
            }
          }
        } else if (marker === 'block') {
          debugger;
          content += text;
          storyDiv.innerHTML = DOMPurify.sanitize(marked?.parse(content) || content);
          hotkeys.deleteScope('render');
          hotkeys('Space', 'render', () => {
            hotkeys.deleteScope('render');
            resolve(content);
          });
          hotkeys.setScope('render');
          document.body.onclick = () => resolve(content);
        }
      });
    }
    let renderedContent = '';
    for (const part of contentParts) {
      renderedContent = await renderContentBlock(part, renderedContent);
    }
    document.getElementById('action-tip').style.display = 'none';
    resolve();
  });
}

async function startGame(scene, state, content, global) {
  const storyDiv = document.getElementById('story');
  const optionsDiv = document.getElementById('options');
  const customStyle = document.getElementById('custom-style');
  showMessage('', 'info')

  optionsDiv.innerHTML = '';
  customStyle.innerHTML = scene.customStyle || '';
  hotkeys.deleteScope('option');
  await renderContent(content);
  //storyDiv.innerHTML = DOMPurify.sanitize(marked?.parse(content) || content);

  if (scene.isEnd) {
    showMessage(`收获结局：${scene.theEnd}`, 'success')
    const button = document.createElement('button');
    button.textContent = '重新开始';
    button.onclick = async () => {
      if (lock) return;
      lock = true;
      fetch(`./${window.storyId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({})
      }).then(res => res.json())
        .then(res => {
          if (!res.code) {
            location.reload();
          } else {
            showMessage(res.message, 'error')
          }
        }).finally(() => lock = false);
    };
    optionsDiv.appendChild(button);
  } else {
    scene.options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'option_' + option.text;
      if (option.id) button.id = 'option_' + option.id;

      button.onclick = () => chooseOption.call(button, option, state);
      if (option.shortcut) hotkeys(option.shortcut, 'option', () => {
        chooseOption.call(button, option, state);
      });
      optionsDiv.appendChild(button);
    });
  }

  if (global.options?.length) {
    const globalDiv = document.getElementById('global');
    const globalOptionsDiv = globalDiv.querySelector('.options');
    globalDiv.classList.remove('hidden');
    globalOptionsDiv.innerHTML = '';
    global.options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'option-btn option_' + option.text;
      if (option.id) button.id = 'global_option_' + option.id;

      button.onclick = () => chooseOption.call(button, option, state, true);
      if (option.shortcut) hotkeys(option.shortcut, 'option', () => {
        chooseOption.call(button, option, state);
      });
      globalOptionsDiv.appendChild(button);
    });
  }

  hotkeys.setScope('option');
  showState(state);
}

function selectItem(inventory, message, needCount=false) {
  return new Promise((resolve, reject) => {
    const cancel = document.getElementById('dialog-cancel');
    const confirmBtn = document.getElementById('dialog-confirm');
    const content = document.getElementById('dialog-content');
    const dialog = document.getElementById('dialog');
    const itemDescription = document.createElement('div');
    itemDescription.className = 'py-2 italic text-sm text-gray-500';
    cancel.onclick = () => {
      dialog.style.visibility = 'hidden';
      reject();
    };
    dialog.style.visibility = 'visible';
    confirmBtn.disabled = true;

    const itemChoose = [];
    const itemList = document.createElement('div');
    itemList.className = 'item-list';
    inventory.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'item cursor-pointer';
      itemDiv.innerHTML = `<span>${item.name}</span>`;
      if (needCount) {
        itemDiv.innerHTML += ' x'
        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.min = 1;
        countInput.max = item.count;
        countInput.value = 1;
        countInput.onchange = () => {
          if (countInput.value < 1 || countInput.value > item.count) {
            countInput.value = 1;
          }
        };
        countInput.onclick = (e) => {
          e.stopPropagation(); // 阻止点击事件冒泡
        }
        itemDiv.appendChild(countInput);
      }
      itemDiv.onclick = () => {
        if (itemChoose.includes(item)) {
          itemChoose.splice(itemChoose.indexOf(item), 1);
          itemDiv.classList.remove('selected');
          itemDescription.textContent = '';
        } else {
          itemDivs = itemList.querySelectorAll('.item');
          itemDivs.forEach(div => div.classList.remove('selected'));
          itemChoose.splice(0, itemChoose.length);
          itemChoose.push(item);
          itemDiv.classList.add('selected');
          itemDescription.textContent = item.description;
        }
        confirmBtn.disabled = itemChoose.length <= 0;
      };
      itemList.appendChild(itemDiv);

      confirmBtn.onclick = () => {
        if (needCount) {
          const countInput = itemDiv.querySelector('input[type="number"]');
          resolve(`item:${item.key}:${countInput.value}`);
        } else resolve(`item:${item.key}`);
        dialog.style.visibility = 'hidden';
      };
    });

    content.innerHTML = `<p>${message}</p>`
    content.appendChild(itemList);
    content.appendChild(itemDescription);
  });
}

function showState(state) {
  const attr = document.querySelector('#profile .attr');
  const inventory = document.querySelector('#profile .inventory');

  attr.innerHTML = '';
  const attrNames = Array.isArray(state.attrName) ? state.attrName.map(({ key, name}) => [key, name]) : Object.entries(state.attrName);
  attrNames.forEach(function ([key, name]) {
    const attrHTML = `<span class="name">${name}</span>
        <span class="value">${state.attr[key]}</span>`
    attr.innerHTML += `<div class="item">${attrHTML}</div>`;
  })

  document.getElementById('attr').style.display = Object.keys(state.attrName).length == 0 ? 'none' : 'block';

  inventory.innerHTML = '';
  const inventorys = state.inventory.filter(item => item.count > 0);
  inventorys.forEach(function (item) {
    if (item.count <= 0) return;
    const itemHTML = `<span class="name">${item.name}</span>
        <span class="value">x ${item.count}</span>`
    inventory.innerHTML += `<div class="item" aria-label="${item.description}">${itemHTML}</div>`;
  })

  document.getElementById('item').style.display = inventorys.length == 0 ? 'none' : 'block';
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
        const { scene, state, content, global } = res.data;
        startGame(scene, state, content, global);
      } else {
        showMessage(res.message, 'error')
      }
    });
}

function resetGame() {
  if(!confirm('确定要重置游戏进度吗？这将清除所有当前的游戏进度。')) return;
  fetch(`./reset`, {
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
      location.reload();
    });
}

function resetAchievement() {
  if(!confirm('确定要重置游戏成就吗？这将清除所有当前获得的游戏成就。')) return;
  fetch(`./reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      timezone: new Date().getTimezoneOffset() / -60,
      achievement: true
    })
  }).then(res => res.json())
    .then(res => {
      location.reload();
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

