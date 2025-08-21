<template>
    <FloatingNavBase>
        <NavigationMenu class="border rounded-xl shadow p-1 fixed top-0 bg-background">
            <NavigationMenuList class="flex md:gap-2 lg:gap-4">
                <NavigationMenuItem>
                    <NavigationMenuLink :class="cn('cursor-pointer', navigationMenuTriggerStyle())"
                        @click="toggleSidebar">
                        <PanelLeft slot="icon" />
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <slot name="other">
                </slot>
            </NavigationMenuList>
        </NavigationMenu>
    </FloatingNavBase>
</template>
<script setup>
import FloatingNavBase from '@/components/FloatingNavBase.vue';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/shadcn/ui/navigation-menu"
import { useSidebar } from "@/components/shadcn/ui/sidebar";
import { PanelLeft } from "lucide-vue-next";
import { cn } from "@/lib/utils";
const { toggleSidebar } = useSidebar()
</script>