<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-14 15:46:25
 * @Description: 
-->
<script lang="ts" setup>
import Analysis from '@/components/Analysis/index.vue';
import useLoginStore from "@/store/login.js";
import { storeToRefs } from 'pinia';
const { proxy } = getCurrentInstance();
const loginStore = useLoginStore();
const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
const activeKey = ref();
const beforeKey = ref();
const left = computed(() => {
    if (Boolean(leftCollapse.value)) {
        // 折叠
        return "2vh";
    } else {
        // 展开
        return "37vh";
    }
});
const right = computed(() => {
    if (Boolean(rightCollapse.value)) {
        // 折叠
        return "2vh";
    } else {
        // 展开
        return "37vh";
    }
});
const right2 = computed(() => {
    if (Boolean(rightCollapse.value)) {
        // 折叠
        return "7vh";
    } else {
        // 展开
        return "42vh";
    }
});
// 菜单激活按钮
function toolClick(key) {
    switch (beforeKey.value) {
        case "measure":
            proxy.$refs.measureRef.hide();
            break;
        case "analysis":
            proxy.$refs.analysisRef.hide();
            break;
        case "layer":
            proxy.$refs.layerRef.hide();
            break;
        default:
            break;
    }
    activeKey.value = key;
    if (beforeKey.value && beforeKey.value == activeKey.value) {
        activeKey.value = null;
        beforeKey.value = null;
        return;
    }
    switch (activeKey.value) {
        case "measure":
            proxy.$refs.measureRef.show();
            break;
        case "analysis":
            proxy.$refs.analysisRef.show();
            break;
        case "layer":
            proxy.$refs.layerRef.show();
            break;
        default:
            break;
    }
    beforeKey.value = key;
}
// 隐藏面板
function hide() {
    // 右侧分析工具
    switch (beforeKey.value) {
        case "measure":
            proxy.$refs.measureRef.hide();
            break;
        case "analysis":
            proxy.$refs.analysisRef.hide();
            break;
        case "layer":
            proxy.$refs.layerRef.hide();
            break;
        default:
            break;
    }
    proxy.$refs.poiSearchRef.hide();
    activeKey.value = null;
    beforeKey.value = null;
}
// 关闭
function close() {
    activeKey.value = null;
    beforeKey.value = null;
}
</script>

<template>
    <div class="analysis-container">
        <Analysis ref="analysisRef" v-show="true" :top="'22vh'" :left="'2vh'"></Analysis>
    </div>
</template>

<style scoped>
.analysis-container{
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 9; /* 中层 */
    left: 0;
    right: 0;
}
</style>
