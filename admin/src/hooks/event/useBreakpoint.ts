import { ref, computed, ComputedRef, unref } from 'vue';
import { useEventListener } from '@/hooks/event/useEventListener';
import { screenEnum, screenMap, sizeEnum } from '@/enums/breakpointEnum';

let globalScreenRef: ComputedRef<sizeEnum | undefined>;
let globalWidthRef: ComputedRef<number>;
let globalRealWidthRef: ComputedRef<number>;

export interface CreateCallbackParams {
  screenRef: ComputedRef<sizeEnum | undefined>;
  widthRef: ComputedRef<number>;
  realWidthRef: ComputedRef<number>;
}

interface CreateCallbackParamsX extends CreateCallbackParams {
  screenRef: ComputedRef<sizeEnum>;
  screenXS: ComputedRef<boolean>;
  screenSM: ComputedRef<boolean>;
  screenMD: ComputedRef<boolean>;
  screenLG: ComputedRef<boolean>;
  screenXL: ComputedRef<boolean>;
}

export function useBreakpoint(): CreateCallbackParamsX {
  const widthRef = computed(() => unref(globalWidthRef) || 0);
  const realWidthRef = computed(() => unref(globalRealWidthRef) || 0);
  const screenRef = computed(() => unref(globalScreenRef) || sizeEnum.MD);
  return {
    widthRef,
    realWidthRef,
    screenRef,
    screenXS: computed(() => unref(screenRef) === sizeEnum.XS),
    screenSM: computed(() => unref(screenRef) === sizeEnum.SM),
    screenMD: computed(() => unref(screenRef) === sizeEnum.MD),
    screenLG: computed(() => unref(screenRef) === sizeEnum.LG),
    screenXL: computed(() => unref(screenRef) === sizeEnum.XL),
  };
}

/** 获取当前屏幕尺寸 */
export function createBreakpointListen() {
  if (globalScreenRef) return;

  const screenRef = ref<sizeEnum>(sizeEnum.XL);
  const realWidthRef = ref(window.innerWidth);

  function getWindowWidth() {
    const width = document.body.clientWidth;
    realWidthRef.value = width;

    const xs = screenMap.get(sizeEnum.XS)!;
    const sm = screenMap.get(sizeEnum.SM)!;
    const md = screenMap.get(sizeEnum.MD)!;
    const lg = screenMap.get(sizeEnum.LG)!;
    if (width < xs) {
      screenRef.value = sizeEnum.XS;
    } else if (width >= xs && width < sm) {
      screenRef.value = sizeEnum.SM;
    } else if (width >= sm && width < md) {
      screenRef.value = sizeEnum.MD;
    } else if (width >= md && width < lg) {
      screenRef.value = sizeEnum.LG;
    } else if (width >= lg) {
      screenRef.value = sizeEnum.XL;
    }
  }
  getWindowWidth();
  useEventListener({ el: window, name: 'resize', listener: () => getWindowWidth() });

  globalScreenRef = computed(() => unref(screenRef));
  globalWidthRef = computed((): screenEnum => screenMap.get(unref(screenRef)!)!);
  globalRealWidthRef = computed((): number => unref(realWidthRef));
}
