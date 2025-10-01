<template>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStatus, useSocket, useActivity} from '@/store'
import { ElMessage } from 'element-plus'
import { EventType } from '@/types'

const router = useRouter()
const socket = useSocket()
const status = useStatus()
const activity = useActivity()

</script>