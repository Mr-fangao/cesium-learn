<!--
 * @Author: liqifeng
 * @Date: 2025-03-11 16:59:45
 * @LastEditors: Mr-fangao Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-13 22:20:07
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
  drawPrimitive();
  addCorridorGeometry(viewer);
  addCircleGeometry(viewer);
  addWallGeometry(viewer);
  addPolylineVolumeGeometry(viewer);
  addCylinderGeometry(viewer)
  viewer.camera.setView({
    destination: Cesium.Rectangle.fromDegrees(105, 45, 120, 25)
  });
  // addCustomTriangle(viewer);
  // addCustomTriangleDS(viewer);
  setTimeout(() => {
  }, 200);
}
function addCylinderGeometry(viewer) {
  const circle = new Cesium.CylinderGeometry({
    //  vertexFormat: Cesium.MaterialAppearance.VERTEX_FORMAT,
    length: 100000,
    topRadius: 30000,
    bottomRadius: 50000,
    slices: 3
  })
  const geometry = Cesium.CylinderGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({
    geometry: geometry,
    modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(
      Cesium.Cartesian3.fromDegrees(110.0, 25.0, 5000)
    )
  })
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      asynchronous: false,
      geometryInstances: instance,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Custom',
            uniforms: {
              baseColor: new Cesium.Color(1.0, 0.0, 0.0, 1.0), // 基础颜色（红色）
              topColor: new Cesium.Color(0.0, 0.0, 1.0, 0.5)  // 顶部颜色（蓝色，半透明）
            },
            source: `
                    czm_material czm_getMaterial(czm_materialInput materialInput) {
                      czm_material material = czm_getDefaultMaterial(materialInput);
                      // 获取纹理坐标的垂直分量（t）
                      float t = materialInput.st.t;
                      // 混合基础颜色和顶部颜色
                      vec4 color = mix(baseColor, topColor, t);
                      material.diffuse = color.rgb;
                      material.alpha = color.a;
                      return material;
                    }
                  `
          }
        }),
      })
    })
  )
}
function addWallGeometry(viewer) {
  let positions = [
    [123.1111, 32.1111, 50000],
    [123.1111, 31.2222, 20000],
    [121.3333, 32.1111, 30000],
    [121.3333, 31.2222, 40000],
  ]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(
    [].concat.apply([], positions)
  )
  const wall = new Cesium.WallGeometry({
    positions: positions
  })
  const geometry = Cesium.WallGeometry.createGeometry(wall)
  const instance = new Cesium.GeometryInstance({
    geometry: geometry
  })
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      asynchronous: false,
      geometryInstances: instance,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Custom',
            uniforms: {
              baseColor: new Cesium.Color(1.0, 0.0, 0.0, 1.0), // 基础颜色（红色）
              topColor: new Cesium.Color(0.0, 0.0, 1.0, 0.5)  // 顶部颜色（蓝色，半透明）
            },
            source: `
                    czm_material czm_getMaterial(czm_materialInput materialInput) {
                      czm_material material = czm_getDefaultMaterial(materialInput);
                      // 获取纹理坐标的垂直分量（t）
                      float t = materialInput.st.t;
                      // 混合基础颜色和顶部颜色
                      vec4 color = mix(baseColor, topColor, t);
                      material.diffuse = color.rgb;
                      material.alpha = color.a;
                      return material;
                    }
                  `
          }
        }),
      })
    }))
}
function addPolylineVolumeGeometry(viewer) {
  let positions = [
    [118.1111, 29.1111, 100],
    [118.1111, 30.2222, 200],
    [120.3333, 29.1111, 300],
    [120.3333, 30.2222, 400],
  ]
  positions = Cesium.Cartesian3.fromDegreesArrayHeights(
    [].concat.apply([], positions)
  )
  function computeCircle(radius) {
    let position1 = []
    for (let i = 0; i < 360; i++) {
      const radians = Cesium.Math.toRadians(i)
      position1.push(
        new Cesium.Cartesian2(
          radius * Math.cos(radians),
          radius * Math.sin(radians)
        )
      )
    }
    return position1
  }
  const geometry = new Cesium.PolylineVolumeGeometry({
    polylinePositions: positions,
    shapePositions: computeCircle(5000),
  })
  const instance = new Cesium.GeometryInstance({
    geometry: geometry
  })
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      asynchronous: false,
      geometryInstances: instance,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Color',
            uniforms: {
              color: Cesium.Color.RED
            }
          }
        })
      })
    })
  )
  // viewer.camera.setView({
  //   destination: Cesium.Rectangle.fromDegrees(120.1111, 30.1111, 120.1111, 30.2222)
  // });
}
function addCorridorGeometry(viewer) {
  const circle = new Cesium.CorridorGeometry({
    positions: Cesium.Cartesian3.fromDegreesArrayHeights([
      120.0, 28.0, 0, 125.1, 28.0, 0, 125.1, 30.1, 0
    ]),
    height: 3000,
    width: 3000,
    extrudedHeight: 500,
    cornerType: Cesium.CornerType.ROUNDED,//转角形状，默认是圆转角
  })
  const geometry = Cesium.CorridorGeometry.createGeometry(circle)
  const instance = new Cesium.GeometryInstance({
    geometry: geometry
  })
  viewer.scene.primitives.add(
    new Cesium.Primitive({
      asynchronous: false,
      geometryInstances: instance,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({
          fabric: {
            type: 'Color',
            uniforms: {
              color: Cesium.Color.RED
            }
          }
        })
      })
    })
  )
}
function drawPrimitive() {
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
  let p = [120.0, 28.0];
  let instances = [];
  let boxGeometry = Cesium.BoxGeometry.fromDimensions({
    dimensions: new Cesium.Cartesian3(10000, 10000, 10000),
    // vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT, 
  })
  for (let i = 0; i < 1000; i++) {
    const instance = new Cesium.GeometryInstance({
      geometry: boxGeometry,
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(p[0] + Math.random() / 1, p[1] + Math.random() / 1, 200 + Math.random() * 100)),
      id: "BoxGeometry" + i,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.fromRandom({ alpha: 0.9 }))
      }
    });
    instances.push(instance);
  }
  viewer.scene.primitives.add(new Cesium.Primitive({
    geometryInstances: instances,
    appearance: new Cesium.PerInstanceColorAppearance({
      flat: true,
      translucent: false
    })
  }));
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
  // 顶点数据
  const positions = new Float32Array([
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0
  ]);

  const colors = new Float32Array([
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
  ]);

  // 创建几何
  const geometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: positions
      }),
      color: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: colors
      })
    },
    indices: new Uint16Array([0, 1, 2]),
    primitiveType: Cesium.PrimitiveType.TRIANGLES
  });

  // 创建着色器外观
  const appearance = new Cesium.Appearance({
    materialSupport: Cesium.MaterialAppearance.MaterialSupport.BASIC,
    renderState: Cesium.Appearance.getDefaultRenderState(true, false),
    vertexShaderSource: `
        attribute vec3 position;
        attribute vec3 color;
        varying vec3 vColor;
        void main() {
            gl_Position = czm_modelViewProjection * vec4(position, 1.0);
            vColor = color;
        }
    `,
    fragmentShaderSource: `
        precision mediump float;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, 1.0);
        }
    `
  });

  // 创建 Primitive
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: geometry
    }),

    appearance: appearance,
    asynchronous: false
  });

  // 添加到 Cesium 场景
  viewer.scene.primitives.add(primitive);
  // 缩放到三角形
  viewer.camera.setView({
    destination: Cesium.Rectangle.fromDegrees(105, 45, 120, 25)
  });
}
function addCustomTriangleDS(viewer) {
  // 定义三角形的顶点坐标（WGS84 坐标系）
  const positions = Cesium.Cartesian3.fromDegreesArrayHeights([
    -75.0, 40.0, 0.0, // 顶点1
    -74.0, 40.0, 0.0, // 顶点2
    -74.5, 41.0, 0.0  // 顶点3
  ]);
  // 手动填充顶点数据
  const values = new Float64Array(9);
  for (let i = 0; i < values.length; i++) {
    values[i] = positions[i % 3][Math.floor(i / 3)];
  }
  // 创建三角形几何体
  const triangleGeometry = new Cesium.Geometry({
    attributes: {
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: values
      })
    },
    indices: new Uint16Array([0, 1, 2]), // 三角形索引
    primitiveType: Cesium.PrimitiveType.TRIANGLES,
    vertexFormat: Cesium.VertexFormat.POSITION_ONLY // 指定顶点格式
  });

  // 创建自定义材质
  const customMaterial = new Cesium.Material({
    fabric: {
      type: 'Custom',
      uniforms: {
        color: new Cesium.Color(1.0, 0.0, 0.0, 1.0) // 红色
      },
      source: `
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          material.diffuse = color.rgb;
          material.alpha = color.a;
          return material;
        }
      `
    }
  });

  // 创建 Primitive 并添加到场景
  const trianglePrimitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: triangleGeometry,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.WHITE)
      }
    }),
    asynchronous: false,
    appearance: new Cesium.MaterialAppearance({
      material: customMaterial,
      flat: true, // 使用平面着色
      vertexFormat: Cesium.VertexFormat.POSITION_ONLY // 与 Geometry 的 vertexFormat 一致
    })
  });

  viewer.scene.primitives.add(trianglePrimitive);

  // 缩放到三角形
  viewer.camera.setView({
    destination: Cesium.Rectangle.fromDegrees(-75.5, 39.5, -73.5, 41.5)
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
