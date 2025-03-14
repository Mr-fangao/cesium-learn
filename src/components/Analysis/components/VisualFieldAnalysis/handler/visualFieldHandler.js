import { GlobalState } from '@/buss/GlobalState';
import msgUtil from '@/buss/MessageUtil.js';
import Bus from '@/buss/eventBus.js';
import viewshed from './viewshed.js';
import coordinates from '@/utils/cesium/Coordinates.js';
import { SetEntity, RemoveEntities, GetPickedRayPositionWGS84 } from '@/utils/cesium/CesiumViewer.js'

let viewshed3D;
let vueInstance = {};
let viewshed3D_AddHeight, viewshed3D_longitude, viewshed3D_latitude, viewshed3D_initHeight, viewPosition;//可视化分析参数
let viewer;
const ENTITYPRE='VISUALFIELD'

function onmousemove(e) {
	//若此标记为false，则激活对可视域分析对象的操作
	if (!viewer.scene.viewFlag) {
		//获取鼠标屏幕坐标,并将其转化成笛卡尔坐标
		let position = e.endPosition;
		let last = viewer.scene.pickPosition(position);
		//计算该点与视口位置点坐标的距离
		if(viewPosition==null||last==null) return;
		let distance = Cesium.Cartesian3.distance(viewPosition.ToCartesian(), last);
		if (distance > 0) {
			//将鼠标当前点坐标转化成经纬度
			let cartographic = Cesium.Cartographic.fromCartesian(last);
			let longitude = Cesium.Math.toDegrees(cartographic.longitude);
			let latitude = Cesium.Math.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			//通过该点设置可视域分析对象的距离及方向
			viewshed3D.viewPositionEnd=new coordinates.CoordinateWGS84(longitude,latitude,height).ToCartesian();
			viewshed3D.updatebypositionend();
		}
	}
}

function onrightclick(e) {
	if (vueInstance.visualFieldEnable) {
		//鼠标右键事件回调，不再执行鼠标移动事件中对可视域的操作
		viewer.scene.viewFlag = true;
		vueInstance.isshowresult.value = true;
        vueInstance.dialogHeight.value = '38vh';
		vueInstance._direction.value = Math.round(viewshed3D.viewHeading);
		// $("#VisualField_div_dir").slider({
		// 	value: Math.round(viewshed3D.viewHeading)
		// });
		vueInstance._pitch.value = Math.round(viewshed3D.viewPitch);

		// $("#VisualField_div_pitch").slider({
		// 	value: Math.round(viewshed3D.viewPitch)
		// });
		// vueInstance.heading=Math.round(viewshed3D.viewHeading);
		// $("#VisualField_div_heading").slider({
		// 	value: Math.round(viewshed3D.viewHeading)
		// });
		vueInstance._distance.value = Math.round(viewshed3D.viewDistance);
		vueInstance.maxdistance.value = vueInstance._distance.value * 2;
		// $("#VisualField_div_distance").slider({
		// 	value: Math.round(viewshed3D.viewDistance)
		// });
		vueInstance._horizontalFov.value = Math.round(viewshed3D.horizontalViewAngle);
		// $("#VisualField_div_horizontalFov").slider({
		// 	value: Math.round(viewshed3D.horizontalViewAngle)
		// });
		vueInstance._verticalFov.value = Math.round(viewshed3D.verticalViewAngle);
		// $("#VisualField_div_verticalFov").slider({
		// 	value: Math.round(viewshed3D.verticalViewAngle)
		// });
	}
}

function onleftclick(e) {
	let pos = GetPickedRayPositionWGS84(e.position);
	if (!pos) return;
	if (vueInstance.visualFieldEnable) {
		SetEntity({
			id:ENTITYPRE+"viewposition",
			position:pos.ToCartesian(),
			point:{
				color:Cesium.Color.YELLOW,
				pixelSize:10
			}
		});
		viewPosition = pos;
		//将获取的点的位置转化成经纬度

		viewshed3D_longitude = pos.longitude;
		viewshed3D_latitude = pos.latitude;
		viewshed3D_initHeight = pos.height;
		let height = 0;
		if (isNaN(viewshed3D_AddHeight) || viewshed3D_AddHeight == '' || viewshed3D_AddHeight <= 0) {
			height = viewshed3D_initHeight;
		} else {
			height = viewshed3D_initHeight + Number(viewshed3D_AddHeight);//抬高
		}
		if (viewer.scene.viewFlag) {
			//设置视口位置
			viewshed3D.viewPosition = new coordinates.CoordinateWGS84(viewshed3D_longitude, viewshed3D_latitude, height).ToCartesian();
			viewshed3D.update();
			//将标记置为false以激活鼠标移动回调里面的设置可视域操作
			viewer.scene.viewFlag = false;
		}
	}
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click,onleftclick)
}
//绘制可视域分析
function getViewshed3D(viewshed3DAddHeight) {
	viewer = viewer || GlobalState.getInstance().viewer;
	// let viewPosition;
	if (!viewer.scene.pickPositionSupported) {
		msgUtil.messagePrompt('info', '不支持深度纹理,可视域分析功能无法使用（无法添加观测）！');
		return;
	}
	//先将此标记置为true，不激活鼠标移动事件中对可视域分析对象的操作
	viewer.scene.viewFlag = true;

	// drawHandler = GlobalState.getInstance().getDarwHandler(viewer, Constant.DRAWMODE.POINT);
	//创建可视域分析对象
	viewshed3D = viewshed3D || new viewshed.ViewShed(viewer);
	// viewshed3D.visibleAreaColor = Cesium.Color.GREEN.withAlpha(0.3);
	// viewshed3D.hiddenAreaColor = Cesium.Color.RED.withAlpha(0.3);
	vueInstance.showMoreFlag = false;
	RemoveEntities(ENTITYPRE);

	viewshed3D.clear();
	viewshed3D_AddHeight = viewshed3DAddHeight;
	//鼠标左键单击
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click,onleftclick);
	//鼠标移动
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Move, onmousemove);
	//鼠标右键
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);
}

//清除可视域分析
function clearViewshed3D() {
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click,onleftclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, onmousemove);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, onrightclick);

	if (viewer) {
		RemoveEntities(ENTITYPRE);
		//viewer.entities.removeAll();
		viewshed3D.clear();
		viewer.scene.viewFlag = true;
	}
	// vueInstance.viewshed3DAddHeight.value = 2;
	vueInstance.isshowresult.value = false;
	vueInstance.showMoreFlag = false;
	viewPosition = null;
	viewshed3D=null;
}

//刷新可视域属性
function refreshViewshed3D(viewshed3Datt) {
	if(viewshed3D==null) return;
	if (!isNaN(viewshed3Datt.direction))
		viewshed3D.viewHeading = viewshed3Datt.direction;
	if (!isNaN(viewshed3Datt.pitch))
		viewshed3D.viewPitch = viewshed3Datt.pitch;
	if (!isNaN(viewshed3Datt.distance))
		viewshed3D.viewDistance = viewshed3Datt.distance;
	if (!isNaN(viewshed3Datt.horizontalFov))
		viewshed3D.horizontalViewAngle = viewshed3Datt.horizontalFov;
	if (!isNaN(viewshed3Datt.verticalFov))
		viewshed3D.verticalViewAngle = viewshed3Datt.verticalFov;
	if (!isNaN(viewshed3Datt.viewshed3DAddHeight))
		viewshed3D.viewPosition = new coordinates.CoordinateWGS84(viewshed3D_longitude, viewshed3D_latitude, viewshed3D_initHeight + Number(viewshed3Datt.viewshed3DAddHeight)).ToCartesian();
	viewshed3D.update();
}

function SetVueInstance(vueinstance) {
	vueInstance = vueinstance;
}

export default {
	refreshViewshed3D,
	getViewshed3D,
	clearViewshed3D,
	SetVueInstance,

}

