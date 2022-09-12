<template>
    <div id="cesiumContainer"></div>
</template>
  
<script>
import { onMounted, } from 'vue'


export default {
    name: 'CesiumContainer',
    setup() {
        onMounted(() => {
            getCesiumDem();
        })
        const getCesiumDem = () => {
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYjgwYjBhYS00OTUzLTQ1OWUtOGE2Mi0zYWZhNDE1MzExZjIiLCJpZCI6MTA2NzU5LCJpYXQiOjE2NjIxMDg4MTl9.8uErS6XFlXZMoy3M4Y0_ASrbC5sVIfxB5kYNCi3mSLw'
            var viewer = new Cesium.Viewer('cesiumContainer')
        }
    },
}
</script>

  <!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#cesiumContainer {
    width: 100%;
    height: 100%;
}
</style>
