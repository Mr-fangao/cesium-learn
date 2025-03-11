import Bus from "@/buss/eventBus";
import coordinates from "./Coordinates.js";
import { GlobalState } from "@/buss/GlobalState";
export function initViewer(containerId) {
	Cesium.Ion.defaultAccessToken =
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyNThiOTQ5Yi04OTkzLTQzZWUtOTJlMC01OTQxNGU0YzMxZWIiLCJpZCI6NzY2OCwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1NDE2OTI3Nn0.5Q_q6jBgYzvO_EKF8V8ypFOkwEc92rLSb9weyeTKoBg";
	const viewer = new Cesium.Viewer(containerId, {
		sceneMode: Cesium.SceneMode.SCENE3D,
		selectionIndicator: false,
		animation: false, //是否显示动画控件
		baseLayerPicker: false, //是否显示图层选择控件
		geocoder: false, //是否显示地名查找控件
		timeline: false, //是否显示时间线控件
		sceneModePicker: false, //模式切换
		navigationHelpButton: false, //是否显示帮助信息控件
		infoBox: false, //是否显示点击要素之后显示的信息
		fullscreenButton: false, //全屏
		homeButton: false, //主页,
		shouldAnimate: true,
		skyAtmosphere: false,
		// baseLayer: new Cesium.ImageryLayer(
		// 	new Cesium.SingleTileImageryProvider({
		// 		url: new URL("./assets/globe.png", import.meta.url).href,
		// 	}),
		// ),
		contextOptions: {
			webgl: {
				alpha: true,
				depth: true,
				stencil: true,
				antialias: true,
				premultipliedAlpha: true,
				//通过canvas.toDataURL()实现截图需要将该项设置为true
				preserveDrawingBuffer: true,
				failIfMajorPerformanceCaveat: true,
			},
		},
	});
	//去除默认双击事件
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	// 开启深度检测
	viewer.scene.globe.depthTestAgainstTerrain = false;
	// 隐藏cesium logo
	viewer.bottomContainer.style.display = "none";
	viewer.scene.screenSpaceCameraController.minimumZoomDistance = 0; //相机的高度的最小值
	viewer.scene.screenSpaceCameraController.maximumZoomDistance = 3000; //相机高度的最大值
	// -------------------注册事件 start ---------------------------------
	let wheelState = false;
	//注册鼠标滚轮按下MIDDLE_DOWN事件
	viewer.screenSpaceEventHandler.setInputAction(function () {
		wheelState = true; //激活指北针动态更新，只有在鼠标中键按下去时才会有效果
	}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
	//注册鼠标滚轮松开MIDDLE_UP事件
	viewer.screenSpaceEventHandler.setInputAction(function () {
		wheelState = false; //取消指北针动态更新
	}, Cesium.ScreenSpaceEventType.RIGHT_UP);
	//注册鼠标左键双击事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	//注册鼠标左键单击事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Left_Click, {
			viewer: viewer,
			movement: movement,
		});
		let cartesian = viewer.scene.pickPosition(movement.position);
		// let ray = viewer.camera.getPickRay(movement.position);
		// let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
		if (cartesian) {
			let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
			let lon = Cesium.Math.toDegrees(cartographic.longitude);
			let lat = Cesium.Math.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			console.log("点击的经纬度坐标为: lon: " + lon + ", lat: " + lat + ", height: " + height);
			// 获取当前地图瓦片级别
			tileLevel(viewer);
		}
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	//注册鼠标右键单击事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Right_Click, movement);
	}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	//注册鼠标移动事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Move, movement);
		if (wheelState) {
			//这里同步指北针用的
			let heading = Cesium.Math.toDegrees(viewer.camera.heading);
			Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Middle_Move, heading);
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	// //注册相机移动起始事件
	// viewer.camera.moveStart.addEventListener(function () {
	// 	//获取当前相机信息
	// 	let cameraAtt = that.getCamera();
	// 	// console.log(cameraAtt);
	// 	Bus.VM.$emit(Bus.SignalType.Scene_Camera_MoveStart, cameraAtt);
	// });
	//鼠标左键按下
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Down, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
	//鼠标左键抬起
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Up, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_UP);
	viewer.scene.camera.changed.addEventListener(function () {
		Bus.VM.$emit("Scene_Camera_Changed", viewer);
	});
	// 场景初始化完成
	Bus.VM.$emit(Bus.SignalType.Scene_Init_Finish, viewer);
	// 扩展viewer
	// debugView(viewer);
	// -----------------------end--------------------------------
	return viewer;
}
// 获取瓦片级别
function tileLevel(viewer) {
	let tiles = new Set();
	let tilesToRender = viewer.scene.globe._surface._tilesToRender;
	if (Cesium.defined(tilesToRender)) {
		for (let i = 0; i < tilesToRender.length; i++) {
			tiles.add(tilesToRender[i].level);
		}
		console.log("当前地图瓦片级别为:" + tiles);
	}
}
/**
 * @Author: dongnan
 * @Description: 开发调试
 * @Date: 2021-08-01 13:02:09
 * @param {*} viewer
 */
function debugView(viewer) {
	let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction(function (movement) {
		let pickedFeature = viewer.scene.pick(movement.endPosition);
		if (
			Cesium.defined(pickedFeature) &&
			Cesium.defined(pickedFeature.collection) &&
			Cesium.defined(pickedFeature.collection.Type) &&
			pickedFeature.collection.Type == "PrimitivePoints"
		) {
			viewer._container.style.cursor = "pointer";
		} else {
			viewer._container.style.cursor = "default";
		}
	}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	viewer.camera.percentageChanged = 0.001;
	viewer.camera.changed.addEventListener(function (moveEndPosition) {
		let ellipsoid = viewer.scene.globe.ellipsoid;
		let cartesian3 = viewer.camera.position;
		let cartograhphic = ellipsoid.cartesianToCartographic(cartesian3);
		let lat = Cesium.Math.toDegrees(cartograhphic.latitude);
		let lng = Cesium.Math.toDegrees(cartograhphic.longitude);
		let alt = cartograhphic.height;
		console.log("位置:" + cartesian3);
		console.log("相机高度:" + alt);
		console.log("heading:", viewer.camera.heading + "," + "pitch:" + viewer.camera.pitch + "," + "roll:" + viewer.camera.roll);
	});
}

export function GetPickedRayPositionWGS84(pos) {
	const viewer = GlobalState.getInstance().viewer;
	if (viewer == null) return;
	var ray = viewer.camera.getPickRay(pos);
	var x = Cesium.Math.toDegrees(ray.direction.x);
	var y = Cesium.Math.toDegrees(ray.direction.y);
	var z = Cesium.Math.toDegrees(ray.direction.z);
	var position = viewer.scene.globe.pick(ray, viewer.scene);
	//var position = this.viewer.camera.pickEllipsoid(pos, this.viewer.scene.globe.ellipsoid);
	var feature = viewer.scene.pick(pos);
	if (!feature || feature === null) {
		if (Cesium.defined(position)) {
			return coordinates.CoordinateWGS84.fromCatesian(position);
		}
	} else {
		var cartesian = viewer.scene.pickPosition(pos);
		if (Cesium.defined(cartesian)) {
			return coordinates.CoordinateWGS84.fromCatesianWithCartographic(cartesian);
		}
	}
	return null;
}
export function SetEntity(entity) {
	const viewer = GlobalState.getInstance().viewer;
	if (viewer == null) return;
	var entityori = viewer.entities.getById(entity.id);
	if (entityori) {
		viewer.entities.remove(entityori);
	}
	//this.viewer.entities.values.unshift(entity);
	return viewer.entities.add(entity);
}
//移除viewer中entityid包含指定id的实体对象
export function RemoveEntities(containentityid) {
	const viewer = GlobalState.getInstance().viewer;
	if (viewer == null) return;
	let removeentityids = [];
	viewer.entities.values.forEach((entity) => {
		if (entity.id.indexOf(containentityid) != -1) removeentityids.push(entity.id);
	});
	removeentityids.forEach((eid) => {
		viewer.entities.removeById(eid);
	});
}
export function GetEntitysByContainId(containentityid) {
	const viewer = GlobalState.getInstance().viewer;
	if (viewer == null) return;

	let result = [];
	viewer.entities.values.forEach((entity) => {
		if (entity.id.indexOf(containentityid) != -1) result.push(entity);
	});
	return result;
}

export function GetCamera() {
	const viewer = GlobalState.getInstance().viewer;
	if (viewer == null) return;
	var ellipsoid = viewer.scene.globe.ellipsoid;
	var cartesian3 = viewer.camera.position;
	var cartographic = ellipsoid.cartesianToCartographic(cartesian3);
	var lat = Cesium.Math.toDegrees(cartographic.latitude);
	var lng = Cesium.Math.toDegrees(cartographic.longitude);
	var alt = cartographic.height;
	return {
		longitude: lng,
		latitude: lat,
		height: alt,
		heading: Cesium.Math.toDegrees(viewer.camera.heading),
		pitch: Cesium.Math.toDegrees(viewer.camera.pitch),
		roll: Cesium.Math.toDegrees(viewer.camera.roll),
	};
}

//heading\pitch都为角度，roll目前全部传参为0
export function CameraGoTo(latitude, longitude, height, heading, pitch, roll, viewercontainerid) {
	// camera set to a position with an orientation using heading, pitch and roll.
	let viewer = GlobalState.getInstance().viewer;
	viewer.scene.camera.setView({
		destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
		orientation: {
			heading: Cesium.Math.toRadians(heading),
			pitch: Cesium.Math.toRadians(pitch),
			roll: Cesium.Math.toRadians(roll),
		},
	});
}
