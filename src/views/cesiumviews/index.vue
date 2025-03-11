<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:43:00
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 17:49:26
 * @Description: 
-->
<template>
    <div>
        <div v-show="isCesium" id="mapcontainer"></div>
        <router-view></router-view>
    </div>
</template>

<script lang="ts" setup>
const isCesium = ref(true);

</script>
<style scoped>
nav {
    background-color: #f0f0f0;
    padding: 10px;
}

nav a {
    margin-right: 10px;
    text-decoration: none;
    color: #333;
}

nav a.router-link-active {
    font-weight: bold;
    color: #42b983;
}
</style>