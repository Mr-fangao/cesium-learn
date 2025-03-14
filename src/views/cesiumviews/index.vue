<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:43:00
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-14 15:39:43
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
import { getTdtVector, getTdtVectorLabel, getTdtImage, getTdtImageLabel, getGoogleImage, getGisImage, getGisVector, getOsm } from "@/utils/cesium/loadProvider.js";
const isCesium = ref(true);
onMounted(() => {
    // CesiumViewer([getTdtImageLabel(), getTdtImage()], "mapcontainer");
    CesiumViewer([getTdtImage()], "mapcontainer");
});
</script>
<style lang="less">
#mainview {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    left: 0;
    top: 0;
    position: relative;
    /* 如果需要定位 */
    z-index: auto;
    /* 避免创建层叠上下文 */

    #mapcontainer {
        width: 100%;
        height: 100vh;
        left: 0;
        top: 0;
        position: relative;
        z-index: 1;
        /* 中层 */
        background: rgba(23, 49, 71, 0.8);
        position: absolute;
    }

}
</style>