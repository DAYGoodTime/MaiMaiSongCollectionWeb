<template>
    <div>
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <slot name="icon" />
                        <div>
                            <span>{{ title }} </span>
                            <span class="block md:inline">{{
                                ScoreStore.selectedSource === sourceKey ? '(当前默认数据源)' : ''
                            }}</span>
                        </div>
                    </div>
                    <div v-if="hasData" class="flex gap-4">
                        <Button variant="outline" @click="emit('export')">
                            导出
                        </Button>
                        <ActionConfirm title="你确定要删除该数据源吗?" confirm-text="删除" cancel-text="保留"
                            @confirm="emit('delete')">
                            <Button variant="destructive">
                                删除
                            </Button>
                        </ActionConfirm>
                    </div>
                </CardTitle>
                <CardDescription>
                    {{ description }}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p class="text-sm font-medium">最后更新时间</p>
                        <p class="text-sm text-muted-foreground">
                            {{ formatDate(updateTime) }}
                        </p>
                    </div>
                    <div class="flex items-center gap-2">
                        <Button v-if="hasData && ScoreStore.selectedSource !== sourceKey" variant="outline"
                            @click="emit('setDefault')" :disabled="!hasData">
                            设为默认
                        </Button>
                        <Button @click="emit('requestUpdate')" :disabled="isUpdating" class="gap-2">
                            <RefreshCw :class="{ 'animate-spin': isUpdating }" class="h-4 w-4" />
                            <span>{{ isUpdating ? '更新中...' : '更新' }}</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- 凭证 Dialog -->
        <Dialog v-model:open="showDialog">
            <DialogContent class="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{{ dialogTitle }}</DialogTitle>
                    <DialogDescription as="div">
                        <slot name="dialog-description" />
                    </DialogDescription>
                </DialogHeader>
                <form @submit.prevent="handleSubmit" class="space-y-4 pt-4">
                    <div class="space-y-2">
                        <Label :for="inputId">{{ credentialLabel }}</Label>
                        <Input :id="inputId" v-model="credentials" :placeholder="credentialPlaceholder" required
                            :disabled="isUpdating" />
                    </div>
                    <slot name="dialog-extra" />
                    <div class="flex items-center gap-2">
                        <Checkbox id="remember-credential" v-model="remember" />
                        <Label for="remember-credential">记住凭证(保存在本地)</Label>
                    </div>
                    <DialogFooter class="gap-4 lg:gap-2">
                        <Button type="button" variant="outline" @click="showDialog = false">
                            取消
                        </Button>
                        <Button type="submit" :disabled="isUpdating">
                            {{ isUpdating ? '更新中...' : '确认更新' }}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Input } from '@/components/shadcn/ui/input'
import { Label } from '@/components/shadcn/ui/label'
import { Checkbox } from '@/components/shadcn/ui/checkbox'
import { RefreshCw } from 'lucide-vue-next'
import { formatDate } from '@/utils/StrUtil'
import { useScores } from '@/store/datasources/scores'
import ActionConfirm from '@/components/ActionConfirm.vue'
import type { AvailableDataSourceType } from '@/types/datasource'

interface Props {
    title: string
    description: string
    sourceKey: AvailableDataSourceType
    updateTime: Date | string
    isUpdating: boolean
    dialogTitle: string
    credentialLabel: string
    credentialPlaceholder: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
    update: [credentials: string, remember: boolean]
    export: []
    delete: []
    setDefault: []
    requestUpdate: []
}>()

const ScoreStore = useScores()

const showDialog = ref(false)
const credentials = ref('')
const remember = ref(false)

const inputId = computed(() => `credential-input-${props.sourceKey}`)

const hasData = computed(() => {
    switch (props.sourceKey) {
        case 'divingfish': return ScoreStore.hasDivingFishData
        case 'lxns': return ScoreStore.hasLXNSData
        case 'usagi': return ScoreStore.hasUsagiData
    }
})

// 供父组件调用，用于直接打开 Dialog（如缓存凭证不存在时）
const openDialog = () => {
    showDialog.value = true
}

// 供父组件调用，用于关闭 Dialog（更新成功后）
const closeDialog = () => {
    showDialog.value = false
    credentials.value = ''
    remember.value = false
}

const handleSubmit = () => {
    emit('update', credentials.value, remember.value)
}

defineExpose({ openDialog, closeDialog, credentials })
</script>
