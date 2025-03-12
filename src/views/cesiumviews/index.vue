<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:43:00
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-12 10:17:25
 * @Description: 
-->
<template>
    <div id="mainview">
        <div id="mapcontainer"></div>
        <router-view></router-view>
    </div>
</template>

<script lang="ts" setup>
import { CesiumViewer, getWebTile } from "./handler/maphandler";
import { GlobalState } from "@/buss/GlobalState";
import { getTdtVector, getTdtVectorLabel, getTdtImage, getTdtImageLabel } from "@/utils/cesium/loadProvider.js";
const isCesium = ref(true);
onMounted(() => {
    CesiumViewer([getTdtImageLabel(), getTdtImage()], "mapcontainer");
});
</script>
<style lang="less">
#mainview {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    left: 0;
    top: 0;
    z-index: 0;
    position: absolute;

    #mapcontainer {
        width: 1920px;
        height: 100vh;
        left: 0;
        top: 0;
        z-index: 1;
        background: rgba(23, 49, 71, 0.8);
        position: absolute;
    }

}
</style>