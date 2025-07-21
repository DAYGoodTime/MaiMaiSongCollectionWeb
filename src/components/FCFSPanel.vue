<template>
    <img :class="cn('', props.class)" :src="getFCFSIcon(conventFcFsStr(props.fc))" />
    <img :class="cn('', props.class)" :src="getFCFSIcon(conventFcFsStr(props.fs))" />
</template>
<script setup lang="ts">
import { cn } from '@/lib/utils';
import { conventFcFsStr } from '@/utils/StrUtil';
import { getFCFSIcon } from '@/utils/urlUtils';
import { type HTMLAttributes } from 'vue';

const props = defineProps<{
    fc: string | null | undefined,
    fs: string | null | undefined,
    class?: HTMLAttributes['class']
}>()
</script>