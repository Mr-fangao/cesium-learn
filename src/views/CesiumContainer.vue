<template>
  <div id="cesiumContainer"></div>
</template>

<script>
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium';

export default {
  name: 'CesiumContainer',
  data() {
    return {
      viewer: null,
      buildingTileset: null,
    }
  },
  mounted() {
  },
  created() {
  },
  mounted() {
    this.getCesiumDem()
  },
  destroyed() {
  },
  methods: {
    // 实例cesium
    getCesiumDem() {
      let _this = this;
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYjgwYjBhYS00OTUzLTQ1OWUtOGE2Mi0zYWZhNDE1MzExZjIiLCJpZCI6MTA2NzU5LCJpYXQiOjE2NjIxMDg4MTl9.8uErS6XFlXZMoy3M4Y0_ASrbC5sVIfxB5kYNCi3mSLw'
      _this.viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain()
      });
      // Add Cesium OSM Buildings, a global 3D buildings layer.
      _this.buildingTileset = _this.viewer.scene.primitives.add(Cesium.createOsmBuildings());
      // Fly the camera to San Francisco at the given longitude, latitude, and height.
      _this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-104.9965, 39.74248, 4000)
      });

      this.$nextTick(() => {
        this.hideBuilding();
        this.getBuildingGeojson()
      })
    },
    addNewBuilding() {
      let _this = this;
      const newBuildingTileset = _this.viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
          url: Cesium.IonResource.fromAssetId(96188)
        })
      );
      // Move the camera to the new building.
      viewer.flyTo(newBuildingTileset);
    },
    hideBuilding() {
      let _this = this;
      _this.buildingTileset.style = new Cesium.Cesium3DTileStyle({
        // Create a style rule to control each building's "show" property.
        show: {
          conditions: [
            // Any building that has this elementId will have `show = false`.
            ['${elementId} === 332469316', false],
            ['${elementId} === 332469317', false],
            ['${elementId} === 235368665', false],
            ['${elementId} === 530288180', false],
            ['${elementId} === 530288179', false],
            // If a building does not have one of these elementIds, set `show = true`.
            [true, true]
          ]
        },
        // Set the default color style for this particular 3D Tileset.
        // For any building that has a `cesium#color` property, use that color, otherwise make it white.
        color: "Boolean(${feature['cesium#color']}) ? color(${feature['cesium#color']}) : color('#ffffff')"
      });
    },
    async getBuildingGeojson() {
      let _this = this;
      // Load the GeoJSON file from Cesium ion.
      const geoJSONURL = await Cesium.IonResource.fromAssetId(1298676);
      // Create the geometry from the GeoJSON, and clamp it to the ground.
      const geoJSON = await Cesium.GeoJsonDataSource.load(geoJSONURL, { clampToGround: true });

      // Add it to the scene.
      const dataSource = _this.viewer.dataSources.add(geoJSON);
      // By default, polygons in CesiumJS will be draped over all 3D content in the scene.
      // Modify the polygons so that this draping only applies to the terrain, not 3D buildings.
      // console.log(dataSource);
      //报错信息 TypeError: Cannot read properties of undefined (reading 'values')
      // for (const entity of dataSource.entities.values) {
      //   entity.polygon.classificationType = Cesium.ClassificationType.TERRAIN;
      // }
      // Move the camera so that the polygon is in view.
      _this.viewer.flyTo(dataSource);

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
}

.cesium-viewer .cesium-widget-credits {
  display: none;
}
</style>
