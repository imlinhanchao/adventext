<script lang="ts" setup>
import { ElMessage, FormInstance } from 'element-plus';
import { clone } from '@/utils';
import { updateThirdParty, ThirdParty, addThirdParty } from '@/api/third';
import KeyMap from './key.vue';

const emit = defineEmits(['confirm']);
const visible = ref(false);
const data = ref<ThirdParty>(new ThirdParty());

function open (third: ThirdParty = new ThirdParty()) {
  data.value = clone(third);
  visible.value = true;
}

defineExpose({
  open,
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
};

const formData = computed(() => ({ ...data.value }));
const formRef = ref<FormInstance>();
const loading = ref(false);
async function submit () {
  if (!(await formRef.value?.validate())) {
    return;
  }

  // https://fishpi.cn/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to=https%3A%2F%2Fadventext.fun%2Fthird%2Flogin&openid.realm=https%3A%2F%2Fadventext.fun&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select
  loading.value = true;
  await (data.value.id ? updateThirdParty : addThirdParty)(data.value!).finally(() => {
    loading.value = false;
  });
  ElMessage.success('保存成功');
  visible.value = false;
  emit('confirm', data.value);
}

const keyRef = ref<InstanceType<typeof KeyMap>>();
function setting (params: Recordable<string>, title: string) {
  return keyRef.value?.open(params, title);
}
</script>

<template>
  <el-dialog
    :title="data.id ? '编辑第三方登录' : '添加第三方登录'" v-model="visible" width="700px" class="max-h-[80vh]"
    append-to-body>
    <el-form ref="formRef" label-width="auto" :model="formData" :rules="rules" class="colon">
      <el-form-item label="名称" name="name">
        <el-input v-model.trim="data.name" clearable />
      </el-form-item>
      <el-form-item label="图标" name="nickname">
        <el-input v-model.trim="data.icon">
          <template #append v-if="data.icon">
            <img :src="data.icon" alt="" class="h-30px" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="用户名前缀" name="prefix">
        <el-input v-model.trim="data.prefix" clearable />
      </el-form-item>
      <el-form-item label="认证地址" name="authUrl">
        <el-input v-model.trim="data.authUrl" clearable>
          <template #suffix>
            <el-button
              icon="el-icon-setting" link type="primary"
              @click="setting(data.authParams || {}, '认证请求参数')?.then(value => (data.authParams = value))" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="校验地址" name="verifyUrl">
        <el-input v-model.trim="data.verifyUrl" clearable>
          <template #prepend>
            <el-select v-model="data.verifyMethod" placeholder="请求方式" class="!w-90px">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
            </el-select>
          </template>
          <template #suffix>
            <el-button
              icon="el-icon-setting" link type="primary"
              @click="setting(data.verifyParams, '校验请求参数')?.then(value => (data.verifyParams = value))" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="校验公式" name="verifyFormula">
        <el-input v-model.trim="data.verifyFormula" clearable />
      </el-form-item>
      <el-form-item label="用户信息地址" name="userUrl">
        <el-input v-model.trim="data.userUrl" clearable>
          <template #prepend>
            <el-select v-model="data.userMethod" placeholder="请求方式" class="!w-90px">
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
            </el-select>
          </template>
          <template #suffix>
            <el-button
              icon="el-icon-setting" link type="primary"
              @click="setting(data.userParams, '用户信息请求参数')?.then(value => (data.userParams = value))" />
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="用户名来源" name="userInfo">
        <el-input v-model.trim="data.userKey.username" />
      </el-form-item>
      <el-form-item label="昵称来源" name="userInfo">
        <el-input v-model.trim="data.userKey.nickname" />
      </el-form-item>
      <el-alert>使用 $auth.xyz 获取认证地址回调参数，$verify.xyz 获取校验接口返回参数，$user.xyz 获取用户信息接口返回参数</el-alert>
    </el-form>
    <KeyMap ref="keyRef" />
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit" :loading="loading">保存</el-button>
    </template>
  </el-dialog>
</template>
