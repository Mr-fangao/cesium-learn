<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: Mr-fangao Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 22:18:21
 * @Description: 
-->
<script setup>
// 获取全局挂载的 dat.GUI
const { proxy } = getCurrentInstance();
const dat = proxy.$dat;
const gui = new dat.GUI({ autoPlace: false })
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
onMounted(() => {
  guiContainer.value.appendChild(gui.domElement);
});
onBeforeUnmount(() => {
  gui.destroy();
});
const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>
  <div ref="guiContainer"></div>
  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p>
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite
    starter
  </p>
  <p>
    Learn more about IDE Support for Vue in the
    <a href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support" target="_blank">Vue Docs Scaling up Guide</a>.
  </p>
  <p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
