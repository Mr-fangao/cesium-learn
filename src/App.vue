<template>
  <div id="app">
    <div class="nav">
      <el-menu class="el-menu-demo" :background-color="bgcstatus ? '#2d2e30' : 'rgba(242, 244, 248, 0)'"
        text-color="#f5f6f7" active-text-color="#ffd04b" :router="true">
        <el-menu-item index="/cesiumContainer">建筑</el-menu-item>
        <el-menu-item index="/CreateEntities">几何图形</el-menu-item>
        <el-menu-item index="/CreateModels">3D模型</el-menu-item>
      </el-menu>
    </div>
    <!-- <router-link to="/cesiumContainer">home</router-link>//跳转首页
    <router-link to="/CreateEntities">test</router-link>//跳转新页面 -->
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'app',
  mounted() {
    this.$router.push("/InitPage")
  }
}

</script>
<style lang="scss">
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}

.nav {
  display: flex;
  position: absolute;
  z-index: 1;
  width: 40%;
  height: 60px;
  background-color: rgba(242, 244, 248, 0);
  border: none;
}

.el-menu {
  border-right: solid 0px var(--el-menu-border-color) !important
}

.el-menu-demo {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  border: none;
}

.nav-active {
  background-color: #2d2e30;
}
</style>
