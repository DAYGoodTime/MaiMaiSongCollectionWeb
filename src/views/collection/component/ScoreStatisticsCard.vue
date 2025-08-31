<template>
    <Card class="shadow hover:shadow-xl">
        <CardTitle>
            <div class="flex justify-between items-center mb-4">
                <div></div>
                <Sheet>
                    <SheetTrigger>
                        <Button variant="ghost" class="mt-1 mr-1">
                            <span class="text-sm text-muted-foreground">显示详细统计信息</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent class="pr-0">
                        <SheetHeader>
                            <SheetTitle>详情统计</SheetTitle>
                        </SheetHeader>
                        <ScrollArea class="flex flex-col gap-2 max-h-full pr-4">
                            <div class="flex flex-col gap-2 my-4">
                                <p class="font-bold">平均达成率:<span>{{ getAvgAchievement }}%</span></p>
                                <p class="font-bold">达成率分布</p>
                                <!-- PC Layout -->
                                <div class="hidden lg:grid lg:grid-cols-2 gap-2">
                                    <div class="flex-1 space-y-2">
                                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_first">
                                            <div class="flex items-center gap-2">
                                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                }}</span>
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
                                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="hidden lg:block">
                                    <div class="grid grid-cols-2 gap-2 pt-2">
                                        <div class="flex-1 space-y-2">
                                            <div class="flex justify-between"
                                                v-for="ranking in statusBoard.rank_second">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex-1 space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold">谱师统计:</p>
                                    <div class="grid grid-cols-2 gap-2 mt-2">
                                        <div class="flex justify-between" v-for="arr in getOrderedNoteDesigner">
                                            <span class="text-sm">{{ arr[0] }}</span>
                                            <div class="min-w-fit">
                                                <span class="text-xl font-bold">{{ arr[1] }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <!-- Mobile Layout -->
                                <div class="block lg:hidden space-y-2">
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
                                <div class="block lg:hidden space-y-4">
                                    <div class="space-y-2">
                                        <div class="flex justify-between" v-for="ranking in statusBoard.rank_second">
                                            <div class="flex items-center gap-2">
                                                <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                    loading="lazy" />
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 pt-2">
                                        <div class="space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statusBoard.apfc">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                        loading="lazy" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="space-y-2">
                                            <div class="flex justify-between" v-for="ranking in statusBoard.fs">
                                                <div class="flex items-center gap-2">
                                                    <img :src="ranking.icon" :alt="ranking.alt" class="h-8"
                                                        loading="lazy" />
                                                </div>
                                                <div>
                                                    <span class="text-xl font-bold">{{ ranking.current }}</span>
                                                    <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                    }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="font-bold">谱师统计:</p>
                                    <div class="flex flex-col gap-2 mt-2">
                                        <div class="flex justify-between" v-for="arr in getOrderedNoteDesigner">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm truncate">{{ arr[0] }}</span>
                                            </div>
                                            <div>
                                                <span class="text-xl font-bold">{{ arr[1] }}</span>
                                                <span class="text-sm text-muted-foreground">/ {{ statusBoard.total
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
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
            </div>
        </CardContent>
    </Card>
</template>
<script setup lang="ts">
import { Card, CardContent, CardTitle } from '@/components/shadcn/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/shadcn/ui/sheet';
import { Button } from '@/components/shadcn/ui/button';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { computed } from 'vue';

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
    noteDesigners: Map<string, number>,
    totalAchievements: number,
    total: number,
}
const { statusBoard } = defineProps<{
    statusBoard: StatusBoard
}>()
const getOrderedNoteDesigner = computed(() => {
    const list = []
    const other: [string, number] = ["其它(<=1)", 0]
    const itr = statusBoard.noteDesigners.entries();
    for (const value of itr) {
        if (value[1] <= 1 && statusBoard.noteDesigners.size > 10) {
            other[1]++;
        } else {
            list.push([value[0], value[1]])
        }
    }
    const sorted = list.sort((s1, s2) => (s2[1] as number) - (s1[1] as number));
    sorted.push(other)
    return sorted;
})
const getAvgAchievement = computed(() => {
    if (statusBoard.total === 0) return 0;
    return (statusBoard.totalAchievements / statusBoard.total).toFixed(4)
})
</script>