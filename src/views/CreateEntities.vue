<template>
    <div id="cesiumContainer"></div>
</template>
  
  <script>
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium';

export default {
    name: 'CesiumContainer',
    mounted() {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYjgwYjBhYS00OTUzLTQ1OWUtOGE2Mi0zYWZhNDE1MzExZjIiLCJpZCI6MTA2NzU5LCJpYXQiOjE2NjIxMDg4MTl9.8uErS6XFlXZMoy3M4Y0_ASrbC5sVIfxB5kYNCi3mSLw';
        var viewer = new Cesium.Viewer('cesiumContainer', {
            baseLayerPicker: false, // 是否显示图层选择控件
            animation: false, // 是否显示动画控件
            vrButton: false, // 是否显示VR控件
            geocoder: false, // 是否显示地名查找控件
            timeline: false, // 是否显示时间线控件
            sceneModePicker: false, // 是否显示投影方式控件
            navigationHelpButton: false, // 是否显示帮助信息控件
            navigationInstructionsInitiallyVisible: false, // 帮助按钮，初始化的时候是否展开
            infoBox: false, // 是否显示点击要素之后显示的信息
            fullscreenButton: false, // 是否显示全屏按钮
            selectionIndicator: true, // 是否显示选中指示框
            homeButton: false, // 是否显示返回主视角控件
            scene3DOnly: false, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
        });
        viewer.entities.add({
            rectangle: {
             coordinates: Cesium.Rectangle.fromDegrees(-100.0, 20.0, -90.0, 30.0),
                material: new Cesium.StripeMaterialProperty({
                    evenColor: Cesium.Color.WHITE,
                    oddColor: Cesium.Color.BLUE,
                    repeat: 5
                })
            }
        });
    }
}
</script>
  
  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style scoped>
  #cesiumContainer {
      width: 100%;
      height: 100%;
  }
  </style>
  