<template>
    <DataSourceCard
        title="水鱼数据源"
        description="管理水鱼成绩的同步和更新"
        source-key="divingfish"
        :update-time="ScoreStore.DivingFishScores.update_time"
        :is-updating="DataSourceUpdating"
        dialog-title="水鱼数据源认证"
        credential-label="成绩导入Token"
        credential-placeholder="请输入成绩导入Token"
        ref="cardRef"
        @request-update="handelUpdate"
        @update="handleDialogSubmit"
        @export="ScoreStore.exportScores('divingfish')"
        @delete="ScoreStore.ClearDataSource('divingfish')"
        @set-default="ScoreStore.switchDataSource('divingfish')"
    >
        <template #icon>
            <Fish class="h-5 w-5" />
        </template>
        <template #dialog-description>
            请输入您的水鱼账号中的成绩导入Token以更新数据源。
            可前往<a class="text-blue-600 hover:underline"
                href="https://www.diving-fish.com/maimaidx/prober/#Profile" target="_blank">账号详情</a>获取。
        </template>
    </DataSourceCard>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Fish } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import DivingFishService from '@/api/fish'
import { HttpError } from '@/api/base'
import { useOAuthStore } from '@/store/oauth'
import { MAX_ERROR_COUNT, useScores } from '@/store/datasources/scores'
import DataSourceCard from './DataSourceCard.vue'

const OAuthStore = useOAuthStore()
const ScoreStore = useScores()
const DataSourceUpdating = ref(false)
const ErrorCount = ref(0)
const cardRef = ref<InstanceType<typeof DataSourceCard>>()

// 更新水鱼数据源核心逻辑
const updateFishDataSource = async (token: string, remember: boolean) => {
    DataSourceUpdating.value = true
    try {
        const result = await DivingFishService.queryFishUserScores(token)
        if (result) {
            ScoreStore.updateScores(result.records, 'divingfish')
            toast.success('水鱼数据源更新成功！', { position: 'top-center' })
            if (remember) {
                OAuthStore.DataSourceCredentials.divingfish = token
            }
            cardRef.value?.closeDialog()
        } else {
            toast.error('水鱼数据源更新失败,返回的数据源为空', { position: 'top-center' })
        }
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.status === 400) {
                toast.error('水鱼数据源更新失败 token无效', { position: 'top-center' })
                return
            }
        }
        toast.error('水鱼数据源更新失败', { position: 'top-center' })
        console.error(error)
        ErrorCount.value++
        if (ErrorCount.value >= MAX_ERROR_COUNT && OAuthStore.hasCredentials('divingfish')) {
            toast.warning('错误次数过多,已为你删除缓存凭证')
            OAuthStore.removeCredentials('divingfish')
        }
    } finally {
        DataSourceUpdating.value = false
    }
}

// 点击更新按钮：有缓存凭证则直接更新，否则打开 Dialog
const handelUpdate = async () => {
    if (OAuthStore.hasCredentials('divingfish')) {
        await updateFishDataSource(OAuthStore.DataSourceCredentials.divingfish, false)
    } else {
        cardRef.value?.openDialog()
    }
}

// Dialog 提交时触发
const handleDialogSubmit = async (credentials: string, remember: boolean) => {
    await updateFishDataSource(credentials, remember)
}
</script>
