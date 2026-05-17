<template>
    <DataSourceCard
        title="UsagiCard(兔卡)"
        description="管理UsagiCard成绩的同步和更新"
        source-key="usagi"
        :update-time="ScoreStore.UsagiScores.update_time"
        :is-updating="DataSourceUpdating"
        dialog-title="UsagiCard数据源认证"
        credential-label="卡片uuid"
        credential-placeholder="请输入UsagiCard的UUID"
        ref="cardRef"
        @request-update="handelUpdate"
        @update="handleDialogSubmit"
        @export="ScoreStore.exportScores('usagi')"
        @delete="ScoreStore.ClearDataSource('usagi')"
        @set-default="ScoreStore.switchDataSource('usagi')"
    >
        <template #icon>
            <img :src="usagiLogo" class="h-5 w-5" />
        </template>
        <template #dialog-description>
            请输入您的UsagiCard账号中的UUID以更新数据源。
            <div v-if="NFCEnabled || WebNFCEnabled">
                <p class="font-bold">似乎你可以通过读取NFC来读取卡片id</p>
                <p class="font-bold">将UsagiCard贴到手机NFC识别处既可自动添加凭证</p>
            </div>
            <p><a class="text-blue-600 hover:underline" href="https://uc.turou.fun/"
                    target="_blank">Usagi主页</a></p>
        </template>
        <template #dialog-extra>
            <Button v-if="WebNFCEnabled" @click="startScan" :disabled="isScanning">{{
                isScanning ? '扫描中' : '通过NFC读取卡片id'
            }}</Button>
        </template>
    </DataSourceCard>
</template>

<script setup lang="ts">
import usagiLogo from '@/assets/usagi_logo.ico';
import { ref, watch } from 'vue'
import { Button } from '@/components/shadcn/ui/button'
import { toast } from 'vue-sonner'
import UsagiService from '@/api/usagi';
import { NFC } from '@day_time/capacitor-nfc-day';
import { Capacitor } from '@capacitor/core';
import { useNFC } from '@/utils/functionUtil';
import { useAppStore } from '@/store/appStore';
import { MAX_ERROR_COUNT, useScores } from '@/store/datasources/scores';
import { useOAuthStore } from '@/store/oauth';
import DataSourceCard from './DataSourceCard.vue'

const OAuthStore = useOAuthStore()
const ScoreStore = useScores();
const DataSourceUpdating = ref(false)
const ErrorCount = ref(0)
const cardRef = ref<InstanceType<typeof DataSourceCard>>()

// 更新Usagi数据源核心逻辑
const updateData = async (uuid: string, remember: boolean) => {
    if (!uuid) {
        toast.error('请填写UsagiCard的uuid', { position: 'top-center' })
        return
    }
    DataSourceUpdating.value = true
    try {
        const result = await UsagiService.queryUsagiUserScore(uuid)
        if (result) {
            ScoreStore.updateScores(result, 'usagi')
            toast.success('Usagi数据源更新成功！')
            if (remember) {
                OAuthStore.DataSourceCredentials.usagi = uuid
            }
            cardRef.value?.closeDialog()
        } else {
            toast.error('Usagi数据源更新失败,返回的数据源为空', { position: 'top-center' });
        }
    } catch (error) {
        ErrorCount.value++;
        toast.error('Usagi数据源更新失败', { position: 'top-center' })
        console.error(error);
        if (ErrorCount.value >= MAX_ERROR_COUNT && OAuthStore.hasCredentials('usagi')) {
            toast.warning('错误次数过多,已为你删除缓存凭证')
            OAuthStore.removeCredentials('usagi')
        }
    } finally {
        DataSourceUpdating.value = false
    }
}

// 点击更新按钮：有缓存凭证则直接更新，否则打开 Dialog
const handelUpdate = async () => {
    if (OAuthStore.hasCredentials('usagi')) {
        await updateData(OAuthStore.DataSourceCredentials.usagi, false)
    } else {
        cardRef.value?.openDialog()
    }
}

// Dialog 提交时触发
const handleDialogSubmit = async (credentials: string, remember: boolean) => {
    await updateData(credentials, remember)
}

// NFC 扫描结果处理
const UUIDRegex = /\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;
const handelNFCScanning = async (message: string) => {
    if (typeof message != 'string') {
        toast.error('无效的UsagiCard', { position: 'top-center' })
        return
    }
    const matched = message.match(UUIDRegex);
    if (matched && matched[1]) {
        toast.success(`读取成功:${matched[1]}`, { position: 'top-center' })
        // 将 UUID 填入 Dialog 的 Input
        if (cardRef.value) {
            cardRef.value.credentials = matched[1]
        }
        await updateData(matched[1], false)
    } else {
        toast.error('无效的UsagiCard', { position: 'top-center' })
    }
}

const { isSupported, isScanning, startScan } = useNFC(handelNFCScanning);
const NFCEnabled = ref(false)
const WebNFCEnabled = Capacitor.getPlatform() === 'web' ? isSupported : false
const appStore = useAppStore();
NFC.isSupported().then(res => {
    NFCEnabled.value = Capacitor.getPlatform() === 'web' ? res.supported : isSupported
})
watch(() => appStore.NFCData, (newVal) => {
    if (newVal) {
        handelNFCScanning(newVal)
    }
})
</script>
