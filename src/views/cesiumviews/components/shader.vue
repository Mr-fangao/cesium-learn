<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: Mr-fangao Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-12 21:49:47
 * @Description: 
-->
<script setup>
import { GlobalState } from "@/buss/GlobalState";
import { nextTick } from "vue";
const { proxy } = getCurrentInstance();
const guiContainer = ref(null);
const dat = proxy.$dat;
const gui = new dat.GUI({ autoPlace: false });
let viewer = null;
const params = {
  speed: 0.5,
  color: '#ff0000',
  visible: true,
};
const handleResize = () => {
  viewer && viewer.resize()
}
function showPrimitive() {
  drawTraingle();
  addCustomTriangle(viewer);
  addCircleGeometry(viewer);
  setTimeout(() => {
  }, 200);
}
function drawTraingle() {
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: Cesium.BoxGeometry.fromDimensions({
          // vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
          dimensions: new Cesium.Cartesian3(400000.0, 400000.0, 400000.0),
          vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        }),
        modelMatrix: Cesium.Matrix4.multiplyByTranslation(
          Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(105.0, 45.0),
          ),
          new Cesium.Cartesian3(0.0, 0.0, 250000),
          new Cesium.Matrix4(),
        ),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.BLUE.withAlpha(0.5),
          ),
        },
      }),
      appearance: new Cesium.EllipsoidSurfaceAppearance({
        material: new Cesium.Material({
        fabric: {
            type: 'Stripe', // 使用条纹材质
            uniforms: {
                orientation: 'vertical', // 垂直方向
                evenColor: Cesium.Color.RED.withAlpha(0.3), // 起始颜色（红色，透明度 0.6）
                oddColor: Cesium.Color.BLUE.withAlpha(0.3), // 结束颜色（蓝色，透明度 0.6）
                repeat: 10 // 渐变重复次数
            }
        }
    })
      })
    }),
  );
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: new Cesium.RectangleGeometry({
          rectangle: Cesium.Rectangle.fromDegrees(110.0, 37.0, 120.0, 39.0),
          height: 1000,
          vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
        }),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE),
        },
      }),
      appearance: new Cesium.PerInstanceColorAppearance(),
    }),
  );
}
function addCircleGeometry(viewer) {
  let p = [110.0, 30.0];
  let instances = [];
  for (let i = 0; i < 10; i++) {
    const instance = new Cesium.GeometryInstance({
      geometry: new Cesium.EllipseGeometry({
        center: Cesium.Cartesian3.fromDegrees(p[0], p[1]),
        semiMinorAxis: 20000.0,
        semiMajorAxis: 20000.0,
        height: 30000 * i,
        vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
        // vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
      }),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED),
      },
    });
    instances.push(instance);
  }
  viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: Cesium.Material.fromType('Color', {
        color: new Cesium.Color(1.0, 0.0, 0.0, 0.6) // 红色，完全不透明
      })
    })
  }));
}
function addCustomTriangle(viewer) {
  // 定义三角形的顶点坐标（WGS84 坐标系）
  const positions = [
    [-75.0, 40.0, 100.0,],// 顶点1
    [-70.0, 40.0, 100.0,],// 顶点2
    [-64.5, 41.0, 100.0]  // 顶点3
  ];
  const colors = new Uint8Array([
    255, 0, 0, 255,   // 红色 (节点1)
    0, 255, 0, 255,   // 绿色 (节点2)
    0, 0, 255, 255    // 蓝色 (节点3)
  ]);
  const coords_world = positions.map((coord) => {
    const cart = Cesium.Cartesian3.fromDegrees(...coord)
    return [cart.x, cart.y, cart.z]
  })
  const coords_vbo = new Float64Array(coords_world.flat())

  // 创建三角形几何体
  const triangleGeometry = new Cesium.Geometry({
    vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT, // 指定所需的顶点格式
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: coords_vbo,
        // vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT // 指定所需的顶点格式
      })
    },
    color: new Cesium.GeometryAttribute({
      componentDatatype: Cesium.ComponentDatatype.UNSIGNED_BYTE,
      componentsPerAttribute: 4,
      values: colors,
      normalize: true // 归一化到 [0, 1]
    }),
    indices: new Uint16Array([0, 1, 2]), // 三角形索引
    primitiveType: Cesium.PrimitiveType.TRIANGLES
  });
  // 创建 Primitive 并添加到场景
  const trianglePrimitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: triangleGeometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED)
      }
    }),
    boundingSphere: Cesium.BoundingSphere.fromVertices(
      coords_vbo,
      new Cesium.Cartesian3(0.0, 0.0, 0.0),
      3
    ),
    asynchronous: false,
    appearance: Cesium.PerInstanceColorAppearance({
      flat: false,//为true时没有阴影，很难看到三维效果
      translucent: false,
    }),
  });

  viewer.scene.primitives.add(trianglePrimitive);

  // 缩放到三角形
  viewer.camera.setView({
    destination: Cesium.Rectangle.fromDegrees(105, 45, 120, 25)
  });
}
onMounted(() => {
  gui.add(params, 'speed', 0, 1).name('Speed').onChange((value) => {
    console.log('Speed changed to:', value);
  });;
  gui.addColor(params, 'color').name('Color');
  gui.add(params, 'visible').name('Visible');
  guiContainer.value.appendChild(gui.domElement);
  window.addEventListener('resize', handleResize)
  nextTick(() => {
    viewer = GlobalState.getInstance().viewer;
    showPrimitive();
  });
});
onBeforeUnmount(() => {
  gui.destroy();
  window.removeEventListener('resize', handleResize)
});
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
