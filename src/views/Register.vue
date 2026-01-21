<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-title">注册</div>
      <el-form ref="registerFormRef" :model="registerForm" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="registerForm.username" placeholder="用户名" />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input v-model.trim="registerForm.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item prop="code">
          <div class="code-row">
            <el-input v-model="registerForm.code" placeholder="验证码" />
            <el-button :disabled="codeCooldown > 0" @click="handleSendCode">
              {{ codeCooldown > 0 ? `${codeCooldown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" placeholder="设置密码" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" placeholder="确认密码" show-password />
        </el-form-item>
        <el-button type="primary" class="auth-button" @click="handleRegister">注册</el-button>
      </el-form>
      <div class="auth-footer">
        <span>已有账号？</span>
        <el-button link @click="goLogin">登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import axios from '@/api/axios'

const router = useRouter()
const phonePattern = /^1[3-9]\d{9}$/

const registerFormRef = ref()
const registerForm = ref({
  username: '',
  phone: '',
  code: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少2位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: phonePattern, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 4, message: '验证码格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
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

const handleSendCode = async () => {
  const phone = registerForm.value.phone.trim()
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

const handleRegister = async () => {
  await registerFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await axios.post('/auth/register', {
        username: registerForm.value.username,
        phone: registerForm.value.phone.trim(),
        code: registerForm.value.code,
        password: registerForm.value.password,
        confirmPassword: registerForm.value.confirmPassword
      })
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (e) {
      ElMessage.error('注册失败')
    }
  })
}

const goLogin = () => {
  router.push('/login')
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
  background: rgba(255, 255, 255, 0.9);
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
