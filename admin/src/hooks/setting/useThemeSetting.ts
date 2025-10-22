import { darken2, lighten2 } from '@/utils/color';
import { useDark } from '@vueuse/core';

export function setPrimaryColor(color: string) {
  const isDark = useDark();
  const docStyle = document?.documentElement?.style;
  if (docStyle) {
    docStyle.setProperty('--el-color-primary', color);
    // 颜色加深或变浅
    for (let i = 1; i <= 9; i++) {
      docStyle.setProperty(
        `--el-color-primary-light-${i}`,
        isDark.value ? darken2(color, i / 10) : lighten2(color, i / 10),
      );
    }
  }
}
