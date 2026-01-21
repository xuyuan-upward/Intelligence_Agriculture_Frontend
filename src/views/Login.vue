<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-title">登录</div>
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="密码登录" name="password">
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="0">
            <el-form-item prop="phone">
              <el-input v-model.trim="passwordForm.phone" placeholder="手机号" @input="clearError" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="passwordForm.password" placeholder="密码" show-password @input="clearError" />
            </el-form-item>
            <div v-if="errorMessage" class="login-error-msg">
              <el-icon><Warning /></el-icon>
              <span>{{ errorMessage }}</span>
              <el-button v-if="showRegisterLink" link type="primary" class="inline-register-link" @click="goRegister">立即注册</el-button>
            </div>
            <el-button type="primary" class="auth-button" @click="handlePasswordLogin">登录</el-button>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="验证码登录" name="code">
          <el-form ref="codeFormRef" :model="codeForm" :rules="codeRules" label-width="0">
            <el-form-item prop="phone">
              <el-input v-model.trim="codeForm.phone" placeholder="手机号" @input="clearError" />
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-row">
                <el-input v-model="codeForm.code" placeholder="验证码" @input="clearError" />
                <el-button :disabled="codeCooldown > 0" @click="handleSendCode('login')">
                  {{ codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <div v-if="errorMessage" class="login-error-msg">
              <el-icon><Warning /></el-icon>
              <span>{{ errorMessage }}</span>
              <el-button v-if="showRegisterLink" link type="primary" class="inline-register-link" @click="goRegister">立即注册</el-button>
            </div>
            <el-button type="primary" class="auth-button" @click="handleCodeLogin">登录</el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div class="auth-footer">
        <span>没有账号？</span>
        <el-button link @click="goRegister">注册</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'
import { useAppStore } from '@/store'

const router = useRouter()
const store = useAppStore()
const activeTab = ref('password')
const phonePattern = /^1[3-9]\d{9}$/

const passwordFormRef = ref()
const codeFormRef = ref()

const errorMessage = ref('')
const showRegisterLink = ref(false)

const clearError = () => {
  errorMessage.value = ''
  showRegisterLink.value = false
}

const passwordForm = ref({
  phone: '',
  password: ''
})
const codeForm = ref({
  phone: '',
  code: ''
})

const passwordRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: phonePattern, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const codeRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: phonePattern, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, message: '验证码格式不正确', trigger: 'blur' }
  ]
}

const codeCooldown = ref(0)
let timerId = null

const startCooldown = () => {
  codeCooldown.value = 60
  timerId = setInterval(() => {
    if (codeCooldown.value > 0) {
      codeCooldown.value -= 1
    } else {
      clearInterval(timerId)
      timerId = null
    }
  }, 1000)
}

const handleSendCode = async (scene) => {
  const form = scene === 'login' ? codeForm.value : codeForm.value
  const phone = form.phone.trim()
  if (!phonePattern.test(phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  try {
    await axios.post('/auth/send-code', { phone })
    ElMessage.success('验证码已发送')
    if (!timerId) startCooldown()
  } catch (e) {
    ElMessage.error('发送失败')
  }
}

const handlePasswordLogin = async () => {
  clearError()
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await axios.post('/auth/login', {
        phone: passwordForm.value.phone.trim(),
        password: passwordForm.value.password,
        loginType: 'password'
      })
      store.setAuth(res.token, res.role, res.userId, res.username)
      router.push('/dashboard')
    } catch (e) {
      if (e.response) {
        errorMessage.value = e.response.data.message || '登录失败'
        if (e.response.status === 404) {
          showRegisterLink.value = true
        }
      } else {
        errorMessage.value = '网络错误，请稍后再试'
      }
    }
  })
}

const handleCodeLogin = async () => {
  clearError()
  await codeFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await axios.post('/auth/login', {
        phone: codeForm.value.phone.trim(),
        code: codeForm.value.code,
        loginType: 'code'
      })
      store.setAuth(res.token, res.role, res.userId, res.username)
      router.push('/dashboard')
    } catch (e) {
      if (e.response) {
        errorMessage.value = e.response.data.message || '登录失败'
        if (e.response.status === 404) {
          showRegisterLink.value = true
        }
      } else {
        errorMessage.value = '网络错误，请稍后再试'
      }
    }
  })
}

const goRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.auth-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: url('@/assets/login-registry.png');
  background-size: cover;
  background-position: center;
}

.auth-card {
  width: 420px;
  padding: 28px 30px 20px;
  border-radius: 14px;
  background: rgba(225, 224, 224, 0.9);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.auth-title {
  font-size: 22px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 18px;
}

.auth-button {
  width: 100%;
}

.login-error-msg {
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 15px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.inline-register-link {
  padding: 0;
  margin-left: 5px;
  font-size: 13px;
}

.auth-footer {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
}

.code-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
</style>
