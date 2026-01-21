<template>
  <div class="user-page">
    <el-card class="user-card" shadow="never">
      <div class="user-header">
        <div class="header-left-title">
          <span>用户管理</span>
          <el-tag type="success" effect="plain" size="small" class="current-user-banner">
            当前登录: {{ store.username }}
          </el-tag>
        </div>
        <el-button type="primary" size="small" @click="fetchUsers">刷新</el-button>
      </div>
      <el-table :data="users" style="width: 100%" :row-class-name="tableRowClassName">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名">
          <template #default="{ row }">
            <div class="username-cell">
              <span>{{ row.username }}</span>
              <el-tag v-if="String(row.id) === String(store.userId)" size="small" type="success" effect="dark" class="self-tag">我</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色" width="140">
          <template #default="{ row }">
            <el-select 
              v-if="String(row.id) !== String(store.userId)"
              v-model="row.role" 
              size="small" 
              :disabled="row.role === 'ADMIN'"
              @change="(val) => updateRole(row.id, val)"
            >
              <el-option label="管理员" value="ADMIN" />
              <el-option label="普通用户" value="USER" />
            </el-select>
            <el-tag v-else type="info" size="small">当前用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from '@/api/axios'
import { useAppStore } from '@/store'

const store = useAppStore()
const users = ref([])

const tableRowClassName = ({ row }) => {
  if (String(row.id) === String(store.userId)) {
    return 'current-user-row'
  }
  return ''
}

const fetchUsers = async () => {
  try {
    const res = await axios.get('/admin/users')
    users.value = Array.isArray(res) ? res : []
  } catch (e) {
    ElMessage.error('获取用户失败')
  }
}

const updateRole = async (userId, role) => {
  try {
    await axios.post('/admin/users/role', { userId, role })
    ElMessage.success('角色已更新')
  } catch (e) {
    ElMessage.error('更新失败')
    await fetchUsers()
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-page {
  width: 100%;
}

.user-card {
  border-radius: 14px;
}

.user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-left-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 700;
}

.current-user-banner {
  font-weight: normal;
  border-radius: 12px;
}

.username-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.self-tag {
  border-radius: 4px;
  font-size: 10px;
  height: 18px;
  line-height: 16px;
  padding: 0 4px;
}

:deep(.current-user-row) {
  background-color: rgba(39, 174, 96, 0.05) !important;
}

:deep(.current-user-row:hover > td) {
  background-color: rgba(39, 174, 96, 0.1) !important;
}
</style>
