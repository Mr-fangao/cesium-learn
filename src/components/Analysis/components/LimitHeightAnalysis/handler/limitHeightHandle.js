import {GetPickedRayPositionWGS84,SetEntity,RemoveEntities} from '@/utils/cesium/CesiumViewer.js';
import {GlobalState} from '@/buss/GlobalState';
import msgUtil from '@/buss/MessageUtil.js';
import Bus from '@/buss/eventBus';

let tooltip, viewer;
let vueInstance = {};

let allcartesians = [];

let limitedHeight = 0;

const entitypre="limitheightanalysis";
function onleftclick(pos) {
	viewer = viewer || GlobalState.getInstance().viewer;

	//收集所有的点
	let cartpos = GetPickedRayPositionWGS84(pos.position).ToCartesian();
	allcartesians.push(cartpos);

	//画当前的点
	SetEntity({
		id:entitypre+"point"+Cesium.createGuid(),
		position: cartpos,
		point: {
			pixelSize: 5,
			color: Cesium.Color.BLUE,
			disableDepthTestDistance: 0
		}
	})


	if (allcartesians.length > 1) {
		//画一条线
		SetEntity({
			id:entitypre+"line",
			polyline: {
				positions: allcartesians,
				material: Cesium.Color.GREEN,
				width: 3,
			}
		})
	}
}

function onrightclick(e) {
	if (allcartesians.length < 3) {
		tooltip.setVisible(false);
		vueInstance.limitHeightEnable = false;
		msgUtil.notifyPrompt("绘制限高分析失败", "请至少左键单击三个点之后再结束", 'warning');
		clearLinearExtrude();
		return;
	}
	RemoveEntities(entitypre);


	tooltip.setVisible(false);
	SetEntity({
		id:entitypre+"polygon",
		polygon: {
			//hierarchy: Cesium.Cartesian3.fromDegreesArray(positions),
			hierarchy: allcartesians,
			height: limitedHeight,
			material: new Cesium.Color(1, 1, 0.20, 0.5),
			outline: true,
			outlineColor: Cesium.Color.RED,
			outlineWidth: 5
		}
	})

	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, onleftclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, onmousemove);
}

function onmousemove(e) {
	if (allcartesians.length < 3) {
		tooltip.showAt(e.startPosition, '<p>点击绘制第' + (allcartesians.length + 1) + '个点</p>');
	} else {
		tooltip.showAt(e.startPosition, '<p>点击绘制第' + (allcartesians.length + 1) + '个点, 或者右击结束绘制</p>');
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
	SetVueInstance
}
