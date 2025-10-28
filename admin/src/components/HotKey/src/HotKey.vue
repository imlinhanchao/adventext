<template>
  <div
    class="shortcut-key-input el-input"
    :class="{ cursor: focus }"
    tabindex="0"
    @focus="handleFocus"
    @blur="handleBlur"
    @keydown="handleKeydown"
  >
    <template v-if="item">
      <el-tag :key="`${item.text}`" closable @close="handleDeleteKey" type="info">
        {{ item.text }}
      </el-tag>
    </template>
    <div v-else class="placeholder">{{ placeholder }}</div>
  </div>
</template>

<script setup name="HotKeyInput">

const CODE_NUMBER = Array.from({ length: 10 }, (v, k) => `Digit${k + 1}`);
const CODE_NUMPAD = Array.from({ length: 10 }, (v, k) => `Numpad${k + 1}`);
const CODE_ABC = Array.from(
  { length: 26 },
  (v, k) => `Key${String.fromCharCode(k + 65).toUpperCase()}`
);
const CODE_FN = Array.from({ length: 12 }, (v, k) => `F${k + 1}`);
const CODE_CONTROL = [
  "Shift",
  "ShiftLeft",
  "ShiftRight",
  "Control",
  "ControlLeft",
  "ControlRight",
  "Alt",
  "AltLeft",
  "AltRight",
]; // ShiftKey Control(Ctrl) Alt

const props = defineProps({
  hotkey: {
    type: [Object, String],
    required: true,
  },
  verify: {
    type: Function,
    default: () => true,
  },
  placeholder: {
    type: String,
    default: "",
  },
  range: {
    type: Array,
    default: () => ["NUMBER", "NUMPAD", "ABC", "FN"],
  },
});

const emit = defineEmits(["update:hotkey", "change"]);

const focus = ref(false);
const item = ref(props.hotkey || null);
const keyRange = ref([]);

// Watch local item to emit updates (mirrors Vue2 watch on data.item)
watch(
  item,
  (val) => {
    if (val) focus.value = false;
    emit("update:hotkey", val || "");
    emit("change", val || "");
  },
  { immediate: false }
);

// Watch prop hotkey to support string form like "Ctrl+Shift+K"
watch(
  () => props.hotkey,
  (val) => {
    if (typeof val !== "string") {
      // keep object or null as-is
      item.value = val;
      return;
    }
    if (val === "") {
      item.value = null;
      return;
    }
    const arr = val.split("+");
    const controlKey = {
      altKey: arr.includes("Alt"),
      ctrlKey: arr.includes("Control"),
      shiftKey: arr.includes("Shift"),
      metaKey: arr.includes("Win"),
      key: arr[arr.length - 1],
      code: `Key${arr[arr.length - 1].toUpperCase()}`,
    };
    const text = arr.reduce((textAcc, cur, i) => {
      if (i) textAcc += "+";
      if (controlKey.key === cur) textAcc += cur.toUpperCase();
      else textAcc += cur;
      return textAcc;
    }, "");
    item.value = {
      text,
      controlKey,
    };
  },
  { immediate: true }
);

// Build keyRange from props.range
watch(
  () => props.range,
  (val) => {
    const keyRangeList = {
      NUMBER: CODE_NUMBER,
      NUMPAD: CODE_NUMPAD,
      ABC: CODE_ABC,
      FN: CODE_FN,
    };
    keyRange.value = [];
    if (Array.isArray(val)) {
      val.forEach((r) => {
        const upper = String(r).toUpperCase();
        if (keyRangeList[upper]) keyRange.value = keyRange.value.concat(keyRangeList[upper]);
      });
    }
  },
  { immediate: true }
);

// Handlers
function handleFocus() {
  if (!item.value) focus.value = true;
}
function handleBlur() {
  focus.value = false;
}
function handleDeleteKey() {
  item.value = null;
}
function handleKeydown(e) {
  const { altKey, ctrlKey, shiftKey, metaKey, key, code } = e;
  if (!CODE_CONTROL.includes(key)) {
    if (!keyRange.value.includes(code)) return;
    let controlKeyText = "";
    [
      { key: altKey, text: "Alt" },
      { key: ctrlKey, text: "Ctrl" },
      { key: shiftKey, text: "Shift" },
      { key: metaKey, text: "Win" },
    ].forEach((curKey) => {
      if (curKey.key) {
        if (controlKeyText) controlKeyText += "+";
        controlKeyText += curKey.text;
      }
    });
    if (key) {
      if (controlKeyText) controlKeyText += "+";
      controlKeyText += key.toUpperCase();
    }
    addHotkey({
      text: controlKeyText,
      controlKey: { altKey, ctrlKey, shiftKey, metaKey, key, code },
    });
  }
  e.preventDefault();
}
function addHotkey(data) {
  if (item.value && data.text === item.value.text) return;
  if (!props.verify(data)) return;
  item.value = data;
}
</script>

<style lang="less" scoped>
@keyframes Blink {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.shortcut-key-input {
  position: relative;
  border: 1px solid var(--el-input-border-color);
  border-radius: 4px;
  background-color: var(--el-input-bg-color,var(--el-fill-color-blank));
  color: var(--el-input-text-color);
  width: 100%;
  height: 2.5em;
  padding: 0 5px;
  cursor: text;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  display: inline-flex;
  align-items: center;

  &:focus {
    border-color: var(--el-input-focus-border-color);
  }

  &.cursor {
    &::after {
      content: "|";
      animation: Blink 1.2s ease 0s infinite;
      font-size: 18px;
      position: absolute;
      top: 0px;
      left: 8px;
    }
  }

  span {
    i {
      position: absolute;
      top: 0;
      bottom: 0;
      margin: auto;
      right: 4px;
      content: "";
      background: url("data:image/svg+xml,%3Csvg class='icon' viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M512 64C264.58 64 64 264.58 64 512s200.5[...]") no-repeat center;
      background-size: contain;
      width: 14px;
      height: 14px;
      transform: scale(0.9);
      opacity: 0.6;

      &:hover {
        cursor: pointer;
        opacity: 1;
      }
    }
  }

  .placeholder {
    position: absolute;
    top: 12px;
    left: 11px;
    color: var(--global-control-text-color);
    font-size: 13px;
    text-indent: 4px;
    font: 400 13.3333px Arial;
  }
}
</style>