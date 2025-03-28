<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: Mr-fangao Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-26 23:14:36
 * @Description: 
-->
<script setup>
import Measure from '@/components/Measure/index.vue';
import { GlobalState } from "@/buss/GlobalState";
import useLoginStore from "@/store/login.js";
import { useRouter } from 'vue-router';
const router = useRouter();
const { proxy } = getCurrentInstance();
const loginStore = useLoginStore();
const guiContainer = ref(null);
const dat = proxy.$dat;
const gui = new dat.GUI({ autoPlace: false });
const params = {
    speed: 0.5,
    color: '#ff0000',
    visible: true,
    backMenu: () => {
        router.push('/menu');
        viewer.scene.primitives.removeAll();
    }
};
let viewer = null;
onMounted(() => {
    // gui.add(params, 'speed', 0, 1).name('Speed').onChange((value) => {
    //   console.log('Speed changed to:', value);
    // });;
    // gui.addColor(params, 'color').name('Color');
    gui.add(params, 'visible').name('Visible');
    gui.add(params, 'backMenu').name('返回菜单');
    guiContainer.value.appendChild(gui.domElement);
    nextTick(() => {
        viewer = GlobalState.getInstance().viewer;
        // viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
        //     url: Cesium.IonResource.fromAssetId(1),
        //     requestWaterMask: true
        // });
    });
});
</script>

<template>
    <div class="analysis-container">
        <div id="GuiContainer" ref="guiContainer"></div>
        <Measure  v-show="true" :top="'22vh'" :left="'2vh'"></Measure>
    </div>
</template>

<style scoped lang="less">
.analysis-container {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 9;
    /* 中层 */
    left: 0;
    right: 0;

    #GuiContainer {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 100;
    }
}
</style>
