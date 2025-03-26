import {
  GetPickedRayPositionWGS84,
  SetEntity,
  RemoveEntities,
} from "@/utils/cesium/CesiumViewer.js";
import { GlobalState } from "@/buss/GlobalState";
import msgUtil from "@/buss/MessageUtil.js";
import Bus from "@/buss/eventBus";

let tooltip, viewer;
let vueInstance = {};

let allcartesians = [];

let limitedHeight = 100;

const entitypre = "limitheightanalysis";
function onleftclick(pos) {
  viewer = viewer || GlobalState.getInstance().viewer;

  // 获取点击位置的世界坐标
  let cartpos = GetPickedRayPositionWGS84(pos.position).ToCartesian();

  // 确保坐标有效
  if (!cartpos || !Cesium.defined(cartpos)) {
    console.error("无法获取有效坐标");
    return;
  }

  // 收集所有的点
  allcartesians.push(cartpos.clone()); // 使用clone()确保不引用同一对象

  // 绘制当前的点
  viewer.entities.add({
    id: entitypre + "point" + Cesium.createGuid(),
    position: cartpos,
    point: {
      pixelSize: 10, // 减小点的大小测试
      color: Cesium.Color.BLUE.withAlpha(0.8),
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 2,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 或 RELATIVE_TO_GROUND
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // 确保点始终可见
    },
  });

  if (allcartesians.length > 1) {
    // 移除之前可能存在的线
    let existingLine = viewer.entities.getById(entitypre + "line");
    if (existingLine) {
      viewer.entities.remove(existingLine);
    }

    // 绘制新的线
    viewer.entities.add({
      id: entitypre + "line",
      polyline: {
        positions: allcartesians,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.GREEN.withAlpha(0.7),
        }),
        width: 5,
        clampToGround: true, // 如果希望线贴地
        // 或者使用以下高度参考
        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      },
    });
  }
}

function onrightclick(e) {
  if (allcartesians.length < 3) {
    tooltip.setVisible(false);
    vueInstance.limitHeightEnable = false;
    msgUtil.notifyPrompt(
      "绘制限高分析失败",
      "请至少左键单击三个点之后再结束",
      "warning"
    );
    clearLinearExtrude();
    return;
  }
  RemoveEntities(entitypre);

  tooltip.setVisible(false);
  SetEntity({
    id: entitypre + "polygon",
    polygon: {
      //hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
      hierarchy: allcartesians,
      height: limitedHeight + 0.1,
      //   extrudedHeight: limitedHeight, // 创建实体体积
      //   heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND, // or ABSOLUTE
      material: new Cesium.Color(1, 1, 0.2, 0.5),
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 5,
	  disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });

  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onleftclick);
  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);
  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, onmousemove);
}

function onmousemove(e) {
  if (allcartesians.length < 3) {
    tooltip.showAt(
      e.startPosition,
      "<p>点击绘制第" + (allcartesians.length + 1) + "个点</p>"
    );
  } else {
    tooltip.showAt(
      e.startPosition,
      "<p>点击绘制第" +
        (allcartesians.length + 1) +
        "个点, 或者右击结束绘制</p>"
    );
  }
}

//限高分析
function linearExtrudeAna(linearExtrudeHeight) {
  viewer = viewer || GlobalState.getInstance().viewer;
  clearLinearExtrude();
  limitedHeight = linearExtrudeHeight;
  if (tooltip) {
    tooltip.setVisible(false);
  }
  tooltip = msgUtil.createTooltip(viewer._element);

  Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, onleftclick);
  Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);
  Bus.VM.$on(Bus.SignalType.Scene_Mouse_Move, onmousemove);
}

//清除限高分析
function clearLinearExtrude() {
  if (tooltip) {
    tooltip.setVisible(false);
  }
  RemoveEntities(entitypre);
  allcartesians = [];
  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onleftclick);
  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);
  Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, onmousemove);
}

function SetVueInstance(vueinstance) {
  vueInstance = vueinstance;
}

export default {
  linearExtrudeAna,
  clearLinearExtrude,
  SetVueInstance,
};
