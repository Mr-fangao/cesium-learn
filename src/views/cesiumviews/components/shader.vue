<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-12 10:36:38
 * @Description: 
-->
<script setup>
import { GlobalState } from "@/buss/GlobalState";
const { proxy } = getCurrentInstance();
const dat = proxy.$dat;
const gui = new dat.GUI({ autoPlace: false });
let viewer = null;
// 定义需要调整的参数
const params = {
  speed: 0.5,
  color: '#ff0000',
  visible: true,
};
// 添加控制器
gui.add(params, 'speed', 0, 1).name('Speed').onChange((value) => {
  console.log('Speed changed to:', value);
});;
gui.addColor(params, 'color').name('Color');
gui.add(params, 'visible').name('Visible');
const guiContainer = ref(null);
const handleResize = () => {
  viewer && viewer.resize()
}
onMounted(() => {
  guiContainer.value.appendChild(gui.domElement);
  window.addEventListener('resize', handleResize)
});
onBeforeUnmount(() => {
  gui.destroy();
  window.removeEventListener('resize', handleResize)
});
const count = ref(0)
</script>

<template>
  <div id="GuiContainer" ref="guiContainer"></div>
</template>

<style scoped>
#GuiContainer {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;
}
</style>
