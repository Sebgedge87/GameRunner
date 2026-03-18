<template>
  <div id="login-screen">
    <div class="login-box">
      <div class="login-title">THE CHRONICLE</div>
      <div class="login-sub">Campaign Management Portal</div>

      <!-- Login form -->
      <div v-if="!showRegister">
        <div class="login-field">
          <label>Username</label>
          <input v-model="loginUser" type="text" placeholder="adventurer" autocomplete="username" />
        </div>
        <div class="login-field">
          <label>Password</label>
          <input v-model="loginPass" type="password" placeholder="••••••••" autocomplete="current-password"
            @keydown.enter="doLogin" />
        </div>
        <div class="login-error">{{ loginError }}</div>
        <button class="login-btn" @click="doLogin" :disabled="loading">
          {{ loading ? 'ENTERING...' : 'ENTER THE CHRONICLE' }}
        </button>
        <div class="login-toggle">
          No account? <a @click="showRegister = true">Register</a>
        </div>
      </div>

      <!-- Register form -->
      <div v-else>
        <div class="login-field">
          <label>Username</label>
          <input v-model="regUser" type="text" placeholder="adventurer" />
        </div>
        <div class="login-field">
          <label>Password</label>
          <input v-model="regPass" type="password" placeholder="••••••••"
            @keydown.enter="doRegister" />
        </div>
        <div class="login-field">
          <label>Character Name <span style="color:var(--text3)">(optional)</span></label>
          <input v-model="regCharName" type="text" placeholder="Thorin Oakenshield" />
        </div>
        <div class="login-field">
          <label>Character Class <span style="color:var(--text3)">(optional)</span></label>
          <input v-model="regCharClass" type="text" placeholder="Fighter" />
        </div>
        <div class="login-error">{{ regError }}</div>
        <button class="login-btn" @click="doRegister" :disabled="loading">
          {{ loading ? 'REGISTERING...' : 'CREATE ACCOUNT' }}
        </button>
        <div class="login-toggle">
          Have an account? <a @click="showRegister = false">Login</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const showRegister = ref(false)
const loading = ref(false)

const loginUser = ref('')
const loginPass = ref('')
const loginError = ref('')

const regUser = ref('')
const regPass = ref('')
const regCharName = ref('')
const regCharClass = ref('')
const regError = ref('')

async function doLogin() {
  loginError.value = ''
  if (!loginUser.value || !loginPass.value) {
    loginError.value = 'Enter username and password.'
    return
  }
  loading.value = true
  try {
    await auth.login(loginUser.value.trim(), loginPass.value)
    router.push('/home')
  } catch (e) {
    loginError.value = e.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  regError.value = ''
  if (!regUser.value || !regPass.value) {
    regError.value = 'Username and password are required.'
    return
  }
  loading.value = true
  try {
    await auth.register({
      username: regUser.value.trim(),
      password: regPass.value,
      character_name: regCharName.value.trim() || undefined,
      character_class: regCharClass.value.trim() || undefined,
    })
    router.push('/home')
  } catch (e) {
    regError.value = e.message || 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>
