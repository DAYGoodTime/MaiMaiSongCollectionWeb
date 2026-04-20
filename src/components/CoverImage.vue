<template>
  <img :src="src" :alt="alt" :class="class" loading="lazy" @error="onError" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getImageCoverUrl } from '@/utils/urlUtils'

const FALLBACK_COVER = getImageCoverUrl(0)

const props = defineProps<{
  id: number
  alt?: string
  class?: string
}>()

const src = ref(getImageCoverUrl(props.id))
let hasFallback = false

watch(() => props.id, (newId) => {
  src.value = getImageCoverUrl(newId)
  hasFallback = false
})

function onError() {
  if (!hasFallback) {
    src.value = FALLBACK_COVER
    hasFallback = true
  }
}
</script>
