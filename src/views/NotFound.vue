<template>
    <div
        class="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div class="text-center">
            <h1 class="text-9xl font-bold text-blue-500 animate-bounce">
                404
            </h1>
            <div class="mt-4 text-2xl font-semibold text-gray-700">
                页面未找到
            </div>
            <p class="mt-2 text-gray-500">
                抱歉，您要访问的页面可能已经被移除或不存在
            </p>
            <div class="mt-8">
                <RouterLink to="/"
                    class="px-6 py-3 text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors duration-200 inline-flex items-center gap-2">
                    <Home class="h-5 w-5"></Home>
                    返回首页
                </RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Home } from 'lucide-vue-next';
</script>
