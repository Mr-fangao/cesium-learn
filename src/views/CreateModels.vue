<template>
    <div id="CreateModels"></div>
</template>
  
  <script>
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium';

export default {
    name: 'CreateModels',
    mounted() {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYjgwYjBhYS00OTUzLTQ1OWUtOGE2Mi0zYWZhNDE1MzExZjIiLCJpZCI6MTA2NzU5LCJpYXQiOjE2NjIxMDg4MTl9.8uErS6XFlXZMoy3M4Y0_ASrbC5sVIfxB5kYNCi3mSLw';
        const viewer = new Cesium.Viewer('CreateModels');
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
  #CreateModels {
      width: 100%;
      height: 100%;
  }
  </style>
  