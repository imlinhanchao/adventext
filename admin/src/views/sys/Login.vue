<script lang="ts" setup>
  import { PageEnum } from '@/enums/pageEnum';
  import { useUserStore } from '@/store/modules/user';
  import { ElNotification, FormInstance, FormRules } from 'element-plus';
  import Logo from '@/layouts/components/logo/index.vue';
  import { generateToken, register, getThirdProviders } from '@/api/user';
  import { useDark } from '@vueuse/core';

  const formData = reactive({
    username: '',
    password: '',
  });

  const formRef = ref<FormInstance>();
  const loading = ref(false);
  const isLogin = ref(true);
  const thirdParties = ref<any[]>([]);

  const rules: FormRules = {
    username: [
      {
        required: true,
        message: '请输入用户名',
        trigger: 'blur',
      },
    ],
    password: [
      {
        required: true,
        message: '请输入密码',
        trigger: 'blur',
      },
    ],
  };
  const userStore = useUserStore();
  const router = useRouter();

  onMounted(() => {
    getThirdProviders().then((res) => {
      thirdParties.value = res;
    });
  });

  async function handleSubmit() {
    await formRef.value?.validate();
    loading.value = true;
    try {
      if (isLogin.value) {
        const userInfo = await userStore.login({
          ...formData,
        });
        if (userInfo) {
          ElNotification.success({
            title: '登录成功',
            message: `欢迎回来: ${userInfo.nickname || userInfo.username}`,
            duration: 2000,
          });
          setTimeout(() => router.replace(PageEnum.BASE_HOME), 1000);
        }
      } else {
        await register({ ...formData });
        ElNotification.success({
          title: '注册成功',
          message: '请登录账号',
          duration: 2000,
        });
        isLogin.value = true;
      }
    } finally {
      loading.value = false;
    }
  }

  const tokenLoading = ref(true);
  generateToken()
    .then((token) => {
      if (!token) return;
      userStore.setToken(token);
      userStore.getUserInfoAction();
      return router.replace(PageEnum.BASE_HOME);
    })
    .finally(() => {
      tokenLoading.value = false;
    });

  useDark();
</script>

<template>
  <div class="relative flex items-center justify-center min-h-full w-full bg-[#f8fbff] dark:bg-[#0f0f13] transition-colors duration-300">
    <div class="relative w-full max-w-[400px] mx-4" v-loading="tokenLoading">
      <div v-if="!tokenLoading" class="bg-white dark:bg-[#18181b] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-300">
        <div class="p-8">
          <!-- Logo & Toggle -->
          <div class="flex flex-col items-center mb-8">
            <Logo class="mb-6 scale-110" />
            
            <div class="grid grid-cols-2 w-full p-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <button 
                type="button"
                class="py-2 text-sm font-medium rounded-md transition-all duration-200"
                :class="isLogin ? 'bg-white dark:bg-[#27272a] text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                @click="isLogin = true"
              >
                登录
              </button>
              <button 
                type="button"
                class="py-2 text-sm font-medium rounded-md transition-all duration-200"
                :class="!isLogin ? 'bg-white dark:bg-[#27272a] text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'"
                @click="isLogin = false"
              >
                注册
              </button>
            </div>
          </div>

          <!-- Form -->
          <el-form ref="formRef" :model="formData" :rules="rules" class="space-y-4" size="large">
            <el-form-item name="username" class="!mb-0">
              <el-input 
                v-model="formData.username" 
                placeholder="用户名" 
                class="minimal-input"
              >
                <template #prefix>
                  <Icon icon="i-mdi:user" class="text-gray-400" />
                </template>
              </el-input>
            </el-form-item>
            
            <el-form-item name="password" class="!mb-0">
              <el-input
                type="password"
                v-model="formData.password"
                placeholder="密码"
                show-password
                @keyup.enter="handleSubmit"
                class="minimal-input"
              >
                <template #prefix>
                  <Icon icon="i-bxs:lock-alt" class="text-gray-400" />
                </template>
              </el-input>
            </el-form-item>

            <el-button 
              type="primary" 
              @click="handleSubmit" 
              :loading="loading" 
              class="w-full !h-10 !rounded-lg !text-sm !mt-2 !font-medium"
            >
              {{ isLogin ? '登 录' : '注 册' }}
            </el-button>
          </el-form>

          <!-- Third Party -->
          <div v-if="isLogin && thirdParties.length" class="mt-8">
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-100 dark:border-gray-800"></div>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-white dark:bg-[#18181b] px-2 text-gray-400">其他登录方式</span>
              </div>
            </div>
            
            <div class="flex justify-center gap-4 mt-6">
              <a
                v-for="item in thirdParties"
                :key="item.id"
                :href="`/auth/third/${item.id}`"
                :title="item.name"
                class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors overflow-hidden"
                style="border: 1px solid var(--el-border-color-lighter)"
              >
                <img
                  v-if="item.icon"
                  :src="item.icon"
                  class="w-9 h-9 object-contain"
                />
                <span v-else class="text-xs scale-75">{{ item.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e4e4e7 inset !important;
  background-color: transparent !important;
  border-radius: 0.5rem;
  transition: all 0.2s;
  padding: 8px 12px;
}

.dark :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #27272a inset !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #a1a1aa inset !important;
}

.dark :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #52525b inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--el-color-primary) inset !important;
}
</style>
