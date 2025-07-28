<template>
    <Card class="mx-auto mt-4 lg:w-[30rem] shadow hover:shadow-xl">
        <CardTitle>
            <div class="flex justify-between items-center mb-4">
                <div></div>
                <Button variant="ghost" class="mt-1 mr-1" @click="showDetailStats = !showDetailStats">
                    <span class="text-sm text-muted-foreground">{{ showDetailStats ? '收起' : '显示详细统计信息' }}</span>
                    <ChevronDown v-if="!showDetailStats" class="ml-1 h-4 w-4" />
                    <ChevronUp v-if="showDetailStats" class="ml-1 h-4 w-4" />
                </Button>
            </div>
        </CardTitle>
        <CardContent>
            <!-- PC Layout -->
            <div class="hidden lg:block">
                <div class="lg:grid lg:grid-cols-2 gap-2">
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_first">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statusBoard.apfc">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 展开后的详细统计 -->
                <div v-show="showDetailStats" class="grid grid-cols-2 gap-2 pt-2">
                    <div class="flex-1 space-y-2">
                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_second">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 space-y-2 mt-4">
                        <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Mobile Layout -->
            <div class="block lg:hidden">
                <div class="space-y-2">
                    <div class="flex justify-between" v-for="ranking in statusBoard.rank_first">
                        <div class="flex items-center gap-2">
                            <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                        </div>
                        <div>
                            <span class="text-xl font-bold">{{ ranking.current }}</span>
                            <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                        </div>
                    </div>
                </div>
                <div v-if="showDetailStats" class="space-y-4">
                    <div class="space-y-2">
                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_second">
                            <div class="flex items-center gap-2">
                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                            </div>
                            <div>
                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2">
                        <div class="space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.apfc">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                                <div class="flex items-center gap-2">
                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" loading="lazy" />
                                </div>
                                <div>
                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import { Card, CardContent, CardTitle } from '@/components/shadcn/ui/card'
import { Button } from '@/components/shadcn/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { ref } from 'vue';
const showDetailStats = ref(false)

export interface StatusValue {
    icon: string,
    current: number,
    alt: string,
    require: any
}
export interface StatusBoard {
    rank_first: StatusValue[],
    rank_second: StatusValue[],
    apfc: StatusValue[],
    fs: StatusValue[],
    total: number,
}
const { statusBoard } = defineProps<{
    statusBoard: StatusBoard
}>()
</script>