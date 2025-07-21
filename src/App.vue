<script setup lang="ts">
import { SidebarProvider, SidebarTrigger } from '@/components/shadcn/ui/sidebar'
import AppSidebar from './components/AppSidebar.vue';
import { Toaster } from '@/components/shadcn/ui/sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <Toaster />
  <nav>
    <SidebarProvider>
      <AppSidebar />
      <main class="w-full">
        <SidebarTrigger />
        <RouterView />
      </main>
    </SidebarProvider>
  </nav>

</template>

<style scoped></style>
