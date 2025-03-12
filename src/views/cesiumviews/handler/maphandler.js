import GroundSkyBox from "@/utils/cesium/GroundSkyBox.js";
import Bus from "@/buss/eventBus";
import { GlobalState } from "@/buss/GlobalState.js";
import coordinates from "@/utils/cesium/Coordinates.js";
//
export function CesiumViewer(imageryList, containerId = "CesiumMap", mode) {
	let options = {
		// contextOptions: {
		// 	webgl: {
		// 		alpha: true,
		// 		reserveDrawingBuffer: true,
		// 		useDefaultRenderLoop: false,
		// 	},
		// },
		// sceneMode: Cesium.SceneMode.SCENE2D,
		contextOptions: {
			webgl: {
				alpha: true,
				// depth: true,
				// stencil: true,
				// antialias: true,
				// premultipliedAlpha: true,
				//通过canvas.toDataURL()实现截图需要将该项设置为true
				preserveDrawingBuffer: true,
				// failIfMajorPerformanceCaveat: true,
			},
		},
		selectionIndicator: false,
		animation: false, //是否显示动画控件
		imageryProvider: false,
		baseLayerPicker: false, //是否显示图层选择控件
		geocoder: false, //是否显示地名查找控件
		timeline: false, //是否显示时间线控件
		sceneModePicker: false, //模式切换
		navigationHelpButton: false, //是否显示帮助信息控件
		infoBox: false, //是否显示点击要素之后显示的信息
		fullscreenButton: false, //全屏
		homeButton: false, //主页,
		shouldAnimate: true,
		shadows: false,
		scene3DOnly: true,
	};
	//超图修改球
	// var obj = [6378137.0, 6378137.0, 6356752.3142451793];
	// Cesium.Ellipsoid.WGS84 = Object.freeze(new Cesium.Ellipsoid(obj[0], obj[1], obj[2]));
	Cesium.Ion.defaultAccessToken = FyConfig.config.cesiumIonAccessToken;
	let viewer = new Cesium.Viewer(containerId, options);

	//设置最大最小相机控制
	// viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500; //相机的高度的最小值
	// viewer.scene.screenSpaceCameraController.maximumZoomDistance = 200000; //相机高度的最大值
	// viewer.scene.shadowMap.darkness = 0.5;
	// viewer.scene.shadowMap.maximumDistance = 1000;
	// viewer.scene.globe.enableLighting = true;
	viewer.scene.context.willReadFrequently = true;
	viewer.scene.globe.enableLighting = false; //关闭光照
	viewer.scene.light = new Cesium.DirectionalLight({
		//去除时间原因影响模型颜色
		direction: new Cesium.Cartesian3(0.35492591601301104, -0.8909182691839401, -0.2833588392420772),
	});
	viewer.shadows = false; //关闭阴影
	// x:118.70167385113061,y:32.41591358401866,z:166615.79224125532
	// viewer.camera.flyTo({
	// 	destination: Cesium.Cartesian3.fromDegrees(117.58067516307437, 35.795163390202, 7702.810655081691),
	// 	orientation: {
	// 		heading: 6.283185307179586,
	// 		pitch: -0.786567697587786,
	// 		roll: 0,
	// 	},
	// 	duration: 0.5,
	// });
	//超图的
	// viewer.imageryLayers.addImageryProvider(Cesium.createOpenStreetMapImageryProvider({
	// 	url: 'https://a.tile.openstreetmap.org/'
	// }));
	// 用来防止一开始出现黑色背景
	viewer.scene.backgroundColor = new Cesium.Color(91 / 255, 134 / 255, 170 / 255, 1);
	// viewer.scene.backgroundColor=new Cesium.Color(0,0,0,0);
	// viewer.scene.globe.show=false;
	viewer.scene.skyAtmosphere.show = false;
	viewer.scene.fog.enabled = false;
	// 添加底图
	// viewer.layers = [];
	viewer.imageryLayers.removeAll();
	if (Array.isArray(imageryList) && imageryList.length > 0) {
		// viewer.imageryLayers.removeAll();
		imageryList.some((item) => {
			// viewer.imageryLayers.add(item);
			let layer = viewer.imageryLayers.addImageryProvider(item.provider, 0);
			// viewer.layers.push(layer);
		});
	}
	// 列表复制
	Array.prototype.clone = function () {
		return JSON.parse(JSON.stringify(this));
	};
	viewer.scene.skyBox.show = true;
	viewer._cesiumWidget._creditContainer.style.display = "none"; //取消版权信息
	viewer.scene.globe.depthTestAgainstTerrain = true;
	//去除默认双击事件
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	//设置鼠标中键
	// viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
	// viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.PINCH, Cesium.CameraEventType.RIGHT_DRAG];
	//开启抗锯齿
	if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
		//判断是否支持图像渲染像素化处理
		viewer.resolutionScale = window.devicePixelRatio;
	}
	// let promise = Cesium.GeoJsonDataSource.load(FyConfig.shuikujson, {
	// 	clampToGround: true,
	// }); //geojson面数据
	// promise.then(function (dataSource) {
	// 	dataSource.name = FyConfig.shuikujson;
	// 	//let geojson = viewer.dataSources.add(dataSource);
	// 	let entities = dataSource.entities.values;
	//
	// 	//水库水面特效暂时注释
	// 	// entities.forEach((entity) => {
	// 	// 	viewer.scene.primitives.add(
	// 	// 		new Cesium.GroundPrimitive({
	// 	// 			classificationType:Cesium.ClassificationType.TERRAIN,
	// 	// 			// debugShowShadowVolume:true,
	// 	// 			// debugShowBoundingVolume:true,
	// 	// 			geometryInstances: new Cesium.GeometryInstance({
	// 	// 				geometry: new Cesium.PolygonGeometry({
	// 	// 					polygonHierarchy: new Cesium.PolygonHierarchy(entity.polygon.hierarchy._value.positions),
	// 	// 				}),
	// 	// 			}),
	// 	// 			appearance: new Cesium.EllipsoidSurfaceAppearance({
	// 	// 				aboveGround: true,
	// 	// 				material: new Cesium.Material({
	// 	// 					fabric: {
	// 	// 						type: "Water",
	// 	// 						uniforms: {
	// 	// 							baseWaterColor: Cesium.Color.fromAlpha(new Cesium.Color(99 / 255, 148 / 255, 233 / 255), 0.25),
	// 	// 							normalMap: "/img/waterNormals.jpg",
	// 	// 							frequency: 1000.0,
	// 	// 							animationSpeed: 0.01,
	// 	// 							amplitude: 2,
	// 	// 							specularIntensity: 5,
	// 	// 						},
	// 	// 					},
	// 	// 				}),
	// 	// 				// material:Cesium.Color.RED,
	// 	// 			}),
	// 	// 			// show: false
	// 	// 		}),
	// 	// 	);
	// 	// });
	// });
	viewer.scene.fxaa = true;
	viewer.scene.postProcessStages.fxaa.enabled = true;
	viewer.scene.moon.show = false;
	viewer.scene.sun.show = false;
	// viewer.clock.onTick.addEventListener(onviewertick);
	// viewer.scene.globe.baseColor = new Cesium.Color(0, 0, 0, 0);
	let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction(function (movement) {
		let campt = Cesium.Ellipsoid.WGS84.cartesianToCartographic(viewer.camera.position);
		let camlon = Cesium.Math.toDegrees(campt.longitude);
		let camlat = Cesium.Math.toDegrees(campt.latitude);
		console.log(
			`当前相机位置为: x:${camlon},y:${camlat},z:${campt.height},heading:${viewer.camera.heading},pitch:${viewer.camera.pitch},roll:${viewer.camera.roll}`,
		);
		let cartesian = viewer.scene.pickPosition(movement.position);
		if (cartesian) {
			let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
			let lon = Cesium.Math.toDegrees(cartographic.longitude);
			let lat = Cesium.Math.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			console.log("点击的经纬度坐标为: lon:" + lon + ",lat:" + lat + ",height:" + height);
			// console.log(lon + "," + lat );
		}
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	//事件
	let wheelState = false;
	//注册鼠标滚轮事件
	// viewer.screenSpaceEventHandler.setInputAction(function () {
	// 	// let currCameraHeight = that.viewer.camera.positionCartographic.height;
	// 	// if (currCameraHeight < 1000) {
	// 	// 	that.viewer.imageryLayers.remove(tdtImgAnnoLayer, falses);
	// 	// } else if (!that.viewer.imageryLayers.contains(tdtImgAnnoLayer)) {
	// 	// 	that.viewer.imageryLayers.add(tdtImgAnnoLayer);
	// 	// }
	// 	// Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Wheel, currCameraHeight);
	// }, Cesium.ScreenSpaceEventType.WHEEL);
	//注册鼠标滚轮按下MIDDLE_DOWN事件
	viewer.screenSpaceEventHandler.setInputAction(function () {
		wheelState = true; //激活指北针动态更新，只有在鼠标中键按下去时才会有效果
	}, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
	//注册鼠标滚轮松开MIDDLE_UP事件
	viewer.screenSpaceEventHandler.setInputAction(function () {
		wheelState = false; //取消指北针动态更新
	}, Cesium.ScreenSpaceEventType.RIGHT_UP);
	let time = 200;
	var timeout = null;
	//注册鼠标左键双击事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		// clearTimeout(timeout);
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_DoubleLeft_Click, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	//注册鼠标左键单击事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		// let position = that.viewer.scene.camera.pickEllipsoid(movement.position, that.viewer.scene.globe.ellipsoid);
		// clearTimeout(timeout);
		// timeout = setTimeout(function () {

		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Left_Click, movement);
		// }, time);
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
	//注册鼠标滚轮事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement,p,p1) {
		Bus.VM.$emit(Bus.SignalType.Scene_Mouse_Wheel, movement);
	}, Cesium.ScreenSpaceEventType.WHEEL);
	//注册鼠标左键按下事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement,p,p1) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Down, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
	//注册鼠标左键抬起事件
	viewer.screenSpaceEventHandler.setInputAction(function (movement,p,p1) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Up, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_UP);
	//注册相机移动起始事件
	// viewer.camera.moveStart.addEventListener(function () {
	// 	//获取当前相机信息
	// 	let cameraAtt = that.getCamera();
	// 	// console.log(cameraAtt);
	// 	Bus.VM.$emit(Bus.SignalType.Scene_Camera_MoveStart, cameraAtt);
	// })
	viewer.camera.moveEnd.addEventListener(() => {
		Bus.VM.$emit(Bus.SignalType.Scene_Camera_MoveEnd);
	});
	//鼠标左键按下
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Down, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
	//鼠标左键抬起
	viewer.screenSpaceEventHandler.setInputAction(function (movement) {
		Bus.VM.$emit(Bus.SignalType.Scene_Left_Up, movement);
	}, Cesium.ScreenSpaceEventType.LEFT_UP);
	viewer.scene.camera.changed.addEventListener(function (par1, par2, par3) {
		Bus.VM.$emit(Bus.SignalType.Scene_Camera_Changed);
	});

	//添加天空盒
	//自带的默认天空盒
	let defaultSkybox = viewer.scene.skyBox;
	viewer.scene.skyBox = new GroundSkyBox({
		sources: {
			negativeX: "/img/skybox/0/nx.png",
			positiveX: "/img/skybox/0/px.png",
			negativeY: "/img/skybox/0/ny.png",
			positiveY: "/img/skybox/0/py.png",
			negativeZ: "/img/skybox/0/nz.png",
			positiveZ: "/img/skybox/0/pz.png",
		},
		rotate: true,
		speed: 0.01,
	});
	viewer.scene.skyAtmosphere.show = false;
	GlobalState.getInstance().viewer = viewer;
	GlobalState.getInstance().sunlight = new Cesium.SunLight({
		color: viewer.scene.light.color,
		intensity: viewer.scene.light.intensity,
	});
	GlobalState.getInstance().centerpos = new Cesium.Cartesian3(-2164303.6690213867, 4418315.076353542, 4050942.5947234794);
	GlobalState.getInstance().moonlight = new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(1, 0, 0) });
	GlobalState.getInstance().sunnyskybox = viewer.scene.skyBox;
	// GlobalState.getInstance().cloudyskybox = new GroundSkyBox({
	// 	sources: {
	// 		negativeX: "/img/skybox/cloud/left.png",
	// 		positiveX: "/img/skybox/cloud/right.png",
	// 		negativeY: "/img/skybox/cloud/front.png",
	// 		positiveY: "/img/skybox/cloud/back.png",
	// 		negativeZ: "/img/skybox/cloud/down.png",
	// 		positiveZ: "/img/skybox/cloud/up.png",
	// 	},
	// 	rotate: true,
	// 	speed: 0.01,
	// });
	GlobalState.getInstance().tilesets = [];
	Bus.VM.$emit(Bus.SignalType.Scene_Init_Finish, viewer);
	return viewer;
}

let issunsimulate = false;

export function SetIsSunSimulate(value) {
	issunsimulate = value;
}

function onviewertick() {
	//设置太阳光或者月亮光
	//太阳光属性设置
	GlobalState.getInstance().sunlight.color = SunLightSettings.Color;
	GlobalState.getInstance().sunlight.intensity = SunLightSettings.LightIntensity;
	//月亮光属性设置
	GlobalState.getInstance().moonlight.color = MoonLightSettings.Color;
	GlobalState.getInstance().moonlight.intensity = MoonLightSettings.LightIntensity;
	let moonposition = GlobalState.getInstance().viewer.scene.moon._ellipsoidPrimitive._boundingSphere.center;
	GlobalState.getInstance().moonlight.direction.x = GlobalState.getInstance().centerpos.x - moonposition.x;
	GlobalState.getInstance().moonlight.direction.y = GlobalState.getInstance().centerpos.y - moonposition.y;
	GlobalState.getInstance().moonlight.direction.z = GlobalState.getInstance().centerpos.z - moonposition.z;
	Cesium.Cartesian3.normalize(GlobalState.getInstance().moonlight.direction, GlobalState.getInstance().moonlight.direction);
	//根据时间设置判断当前显示什么光
	let jsDate = new Date(GlobalState.getInstance().viewer.clock.currentTime.toString());
	let date = timeFormatConvert(jsDate);
	if ((date.H > 6 && date.H < 18) || issunsimulate === true) {
		GlobalState.getInstance().viewer.scene.light = GlobalState.getInstance().sunlight;
		GlobalState.getInstance().viewer.shadowMap.maximumDistance = SunLightSettings.ShadowDistance;
	} else {
		GlobalState.getInstance().viewer.scene.light = GlobalState.getInstance().moonlight;
		// GlobalState.getInstance().viewer.shadowMap.maximumDistance=MoonLightSettings.ShadowDistance;
	}
}

export function GetCamera() {
	let viewer = GlobalState.getInstance().viewer;
	let ellipsoid = viewer.scene.globe.ellipsoid;
	let cartesian3 = viewer.camera.position;
	let lat;
	let lng;
	let alt;
	let cartographic = ellipsoid.cartesianToCartographic(cartesian3);
	lat = Cesium.Math.toDegrees(cartographic.latitude);
	lng = Cesium.Math.toDegrees(cartographic.longitude);
	alt = cartographic.height;
	return {
		longitude: lng,
		latitude: lat,
		height: alt,
		heading: Cesium.Math.toDegrees(viewer.camera.heading),
		pitch: Cesium.Math.toDegrees(viewer.camera.pitch),
		roll: Cesium.Math.toDegrees(viewer.camera.roll),
	};
}

//heading\pitch都为角度，roll目前全部传参为0 duration单位为秒
export function FlyToWithDuration(latitude, longitude, height, heading, pitch, roll, duration) {
	let viewer = GlobalState.getInstance().viewer;
	if (duration === -1) {
		viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
			orientation: {
				heading: Cesium.Math.toRadians(heading),
				pitch: Cesium.Math.toRadians(pitch),
				roll: Cesium.Math.toRadians(roll),
			},
			maximumHeight: 10,
			// maximumHeight:10,
			// pitchAdjustHeight:10,
			//easingFunction : Cesium.EasingFunction.BACK_IN_OUT
		});
	}
	viewer.camera.flyTo({
		destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
		orientation: {
			heading: Cesium.Math.toRadians(heading),
			pitch: Cesium.Math.toRadians(pitch),
			roll: Cesium.Math.toRadians(roll),
		},
		duraion: duration,
	});
}

/*
 * @param {string} url 瓦片地址
 * @param {string} name 名称
 */
export function getWebTile(url, show) {
	let provider = new Cesium.UrlTemplateImageryProvider({
		// url: "http://localhost:3232/zz-tile-blue/{z}/{x}/{y}.png",
		url: url,
	});
	return {
		provider: provider,
		show: show ?? false,
	};
}

/**
 * @Author: dongnan
 * @Description: 天地图 矢量
 * @Date: 2021-11-07 00:20:07
 */
export function getTdtVector() {
	return new Cesium.WebMapTileServiceImageryProvider({
		url: "http://t0.tianditu.gov.cn/vec_w/wmts?tk=" + FyConfig.Tdtkey,
		layer: "vec",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
}

/**
 * @Author: dongnan
 * @Description: 天地图 矢量标注
 * @Date: 2021-11-07 00:24:07
 */
export function getTdtVectorLabel() {
	return new Cesium.WebMapTileServiceImageryProvider({
		url: "http://t{s}.tianditu.gov.cn/cva_w/wmts?tk=" + FyConfig.Tdtkey,
		subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
		layer: "cva",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
}

/**
 * @Author: dongnan
 * @Description: 天地图 影像
 * @Date: 2021-11-07 00:24:20
 */
export function getTdtImage() {
	return new Cesium.WebMapTileServiceImageryProvider({
		url: "http://t{s}.tianditu.gov.cn/img_w/wmts?tk=" + FyConfig.Tdtkey,
		subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
		layer: "img",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
}

/**
 * @Author: dongnan
 * @Description: 天地图 影像标注
 * @Date: 2021-11-07 00:24:36
 */
export function getTdtImageLabel() {
	return new Cesium.WebMapTileServiceImageryProvider({
		url: "http://t{s}.tianditu.gov.cn/cia_w/wmts?tk=" + FyConfig.Tdtkey,
		subdomains: ["0", "1", "2", "3", "4", "5", "6", "7"],
		layer: "cia",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
}

export function GetWindowPosFromWGS84(wgs84, viewer) {
	let car3 = Cesium.Cartesian3.fromDegrees(wgs84.longitude, wgs84.latitude, wgs84.height);
	return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, car3);
}

export function GetPickedRayPositionWGS84(pos, viewer) {
	var ray = viewer.camera.getPickRay(pos);
	var x = Cesium.Math.toDegrees(ray.direction.x);
	var y = Cesium.Math.toDegrees(ray.direction.y);
	var z = Cesium.Math.toDegrees(ray.direction.z);
	var position = viewer.scene.globe.pick(ray, viewer.scene);
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

export function GetEntitysByContainId(containentityid, viewer) {
	let result = [];
	viewer.entities.values.forEach((entity) => {
		if (entity.id.indexOf(containentityid) != -1) result.push(entity);
	});
	return result;
}

export function GetEntityByID(entityid, viewer) {
	return viewer.entities.getById(entityid);
}

export function RemoveEntitysByContainId(containentityid, viewer = null) {
	viewer = viewer || GlobalState.getInstance().viewer;
	let entitys = GetEntitysByContainId(containentityid, viewer);
	entitys.forEach((entity) => {
		viewer.entities.remove(entity);
	});
}

//添加实体对象
export function SetEntity(entity, viewer = null) {
	viewer = viewer || GlobalState.getInstance().viewer;
	let entityori = viewer.entities.getById(entity.id);
	if (entityori) {
		viewer.entities.remove(entityori);
	}
	return viewer.entities.add(entity);
}

//移除集合中指定id的实体对象
export function RemoveEntityById(viewer, entityid) {
	viewer.entities.removeById(entityid);
}

export function GetLerpWGS84(wgs84pos1, wgs84pos2, tpoint, viewer) {
	var cartesian1 = Cesium.Cartesian3.fromDegrees(wgs84pos1.longitude, wgs84pos1.latitude, wgs84pos1.height);
	var cartesian2 = Cesium.Cartesian3.fromDegrees(wgs84pos2.longitude, wgs84pos2.latitude, wgs84pos2.height);
	var cartesian3 = Cesium.Cartesian3.lerp(cartesian1, cartesian2, tpoint, new Cesium.Cartesian3());
	var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3);
	return new coordinates.CoordinateWGS84(
		Cesium.Math.toDegrees(cartographic.longitude),
		Cesium.Math.toDegrees(cartographic.latitude),
		cartographic.height,
	);
}

// wkt to lonlat
function geomToListMultiPolygon(geom) {
	let str = geom.substr(15, geom.length - 3);
	let str2 = str.split(",");
	let list = [];
	str2.some((item) => {
		let sList = item.split(" ");
		let nList = [parseFloat(sList[0]), parseFloat(sList[1])];
		list.push(nList);
	});
	return list;
}

function geomToListPolygon(geom) {
	let str = geom.substr(9, geom.length - 12);
	let str2 = str.split(",");
	let list = [];
	str2.some((item) => {
		let sList = item.split(" ");
		let nList = [parseFloat(sList[0]), parseFloat(sList[1])];
		list.push(nList);
	});
	return list;
}

export function geomToList(geom) {
	return geom.indexOf("MULTIPOLYGON(") >= 0 ? geomToListMultiPolygon(geom) : geomToListPolygon(geom);
}

export function SetCurrentTime(viewer, year, month, day, hour, minute, second, addsecond = 0) {
	var date = new Date(year, month - 1, day, hour, minute, second);
	date = new Date(date.getTime() + addsecond * 1000);
	var julian_time = Cesium.JulianDate.fromDate(date);
	viewer.clock.currentTime = julian_time;
}

export function SetSnowVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_snow");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_snow",
				fragmentShader:
					"uniform sampler2D colorTexture; //输入的场景渲染照片\n" +
					"varying vec2 v_textureCoordinates;\n" +
					"\n" +
					"float snow(vec2 uv,float scale)\n" +
					"{\n" +
					"    float time = czm_frameNumber / 60.0;\n" +
					"    float w=smoothstep(1.0,0.0,-uv.y*(scale/10.));\n" +
					//  "    if(w<0.1)return 0.;\n" +//可以不需要
					"    uv+=time/scale;\n" +
					"    uv.y+=time*2./scale;\n" +
					// "    uv.x+=sin(uv.y+time*.5)/scale;\n" +
					"    uv.x+=sin(uv.y+time*0.5)/scale;\n" +
					"    uv*=scale;\n" +
					"    vec2 s=floor(uv),f=fract(uv),p;\n" +
					"    float k=3.,d;\n" +
					// "    p=.5+.35*sin(11.*fract(sin((s+scale)*mat2(7,3,6,5))*5.))-f;\n" +
					// "    p=sin((s)*mat2(1,0,1,0));\n" +
					"    p=.5+.35*sin(11.*fract(sin((s+scale)*mat2(7,3,6,5))*5.))-f;\n" +
					"    d=length(p);\n" +
					"    k=min(d,k);\n" +
					"    k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n" +
					"    return k*w;\n" +
					//"    return k;\n" +
					"}\n" +
					"\n" +
					"void main(void){\n" +
					"    vec2 resolution = czm_viewport.zw;\n" +
					"    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
					"    vec3 finalColor=vec3(0);\n" +
					"    //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n" +
					"    float c = 0.0;\n" +
					"    c+=snow(uv,30.)*0.0;\n" + //没有用因为乘以系数0
					"    c+=snow(uv,20.)*0.0;\n" + //没有用因为乘以系数0
					"    c+=snow(uv,15.)*0.0;\n" + //没有用因为乘以系数0
					"    //c+=snow(uv,10.);\n" +
					"    c+=snow(uv,8.);\n" +
					"    c+=snow(uv,6.);\n" +
					"    c+=snow(uv,5.);\n" +
					"    finalColor=(vec3(c)); //屏幕上雪的颜色\n" +
					"    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);  //将雪和三维场景融合\n" +
					"\n" +
					"}",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

export function SetRainVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_rain");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_rain",
				fragmentShader:
					"uniform sampler2D colorTexture;//输入的场景渲染照片\n" +
					"varying vec2 v_textureCoordinates;\n" +
					"\n" +
					"float hash(float x){\n" +
					"    return fract(sin(x*133.3)*13.13);\n" +
					"}\n" +
					"\n" +
					"void main(void){\n" +
					"\n" +
					"    float time = czm_frameNumber / 60.0;\n" +
					"    vec2 resolution = czm_viewport.zw;\n" +
					"\n" +
					"    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
					"    vec3 c=vec3(.6,.7,.8);\n" +
					"\n" +
					"    float a=-.4;//雨跟地面的夹角\n" +
					"    float si=sin(a),co=cos(a);\n" +
					"    uv*=mat2(co,-si,si,co);\n" +
					"    uv*=length(uv+vec2(0,4.9))*.3+1.;\n" +
					"\n" +
					"    float v=1.-sin(hash(floor(uv.x*100.))*2.);\n" +
					"    float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n" +
					"    c*=v*b; //屏幕上雨的颜色\n" +
					"\n" +
					"    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5); //将雨和三维场景融合\n" +
					"}",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

export function SetFogVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_fog");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_fog",
				//sampleMode:PostProcessStageSampleMode.LINEAR,
				fragmentShader:
					"  uniform sampler2D colorTexture;\n" +
					"  uniform sampler2D depthTexture;\n" +
					"  varying vec2 v_textureCoordinates;\n" +
					"  void main(void)\n" +
					"  {\n" +
					"      vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);\n" +
					"      vec4 fogcolor=vec4(0.8,0.8,0.8,0.5);\n" +
					"\n" +
					"      float depth = czm_readDepth(depthTexture, v_textureCoordinates);\n" +
					"      vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);\n" +
					"\n" +
					//"      float f=(depthcolor.r-0.22)/0.2;\n" +//修改后的线性雾
					"      float f=(depthcolor.r-0.7)/0.2;\n" + //第一次使用的线性雾"
					// "    float f=1.0-pow(2.71828,0.0-(depthcolor.r-0.28)/0.08);\n" +//修改后的指数雾
					"      if(f<0.0) f=0.0;\n" +
					"      else if(f>1.0) f=1.0;\n" +
					"      gl_FragColor = mix(origcolor,fogcolor,f);\n" +
					"   }",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

export function SetCloudyVisible(visible, viewer) {
	viewer.scene.skyBox = GlobalState.getInstance().cloudyskybox;
}

export function SetSunnyVisible(visible, viewer) {
	viewer.scene.skyBox = GlobalState.getInstance().sunnyskybox;
}

/** 时间格式转换
 * @param e 要转换的日期(如：Sat Nov 26 2022 21:37:29 GMT+0800 (中国标准时间))
 * @returns {string} 转换结果(如：2022-11-26 21:37:29)
 */
export function timeFormatConvert(e) {
	const Y = e.getFullYear(); // 年
	const M = prefixZero(e.getMonth() + 1); // 月
	const D = prefixZero(e.getDate()); // 日
	const H = prefixZero(e.getHours()); // 时
	const Mi = prefixZero(e.getMinutes()); // 分
	const S = prefixZero(e.getSeconds()); // 秒
	// return {Y + "-" + M + "-" + D + " " + H + ":" + Mi + ":" + S;}
	return { Y, M, D, H, Mi, S };
}

export function prefixZero(num = 0, n = 2) {
	// 数字位数不够，数字前面补零
	return (Array(n).join("0") + num).slice(-n);
}

/**
 * 昼夜切换
 * @param isday：true为白昼，时间设为中午12点，false为黑色，时间设为夜里12点，时区为当前设定的时区，默认为东八区
 * @param viewer
 * @constructor
 */
export function SetDayOrNight(isday, viewer) {
	viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
	viewer.scene.globe.enableLighting = true;
	viewer.clock.shouldAnimate = true;
	viewer.clock.multiplier = 0;
	let jsDate = new Date(viewer.clock.currentTime.toString());
	let date = timeFormatConvert(jsDate);
	if (!isday) {
		let offset = 24 - date.H;
		viewer.clock.currentTime = Cesium.JulianDate.addHours(Cesium.JulianDate.now(new Date()), offset, new Cesium.JulianDate());
		setAllLayerBrightnes(0.4, viewer);
	} else if (isday) {
		let offset = 12 - date.H;
		viewer.clock.currentTime = Cesium.JulianDate.addHours(Cesium.JulianDate.now(new Date()), offset, new Cesium.JulianDate());
		setAllLayerBrightnes(1, viewer);
	}
}

//设置所有图层的亮度
export function setAllLayerBrightnes(brightness, viewer) {
	var layers = viewer.imageryLayers;
	for (var i = 0; i < layers.length; i++) {
		var layer = layers.get(i);
		layer.brightness = brightness;
	}
}

export const MoonLightSettings = reactive({
	// <!--阴影可见距离-->
	ShadowDistance: 5000,
	OriginShadowDis: 5000,
	// <!--光强-->
	LightIntensity: 1,
	OriginLightIntensity: 1,
	// <!--色温-->
	LightTemp: 6500,
	OriginLightTemp: 6500,
	// <!--颜色rgb-->
	Color: Cesium.Color.WHITE,
	OriginColor: Cesium.Color.WHITE,
	DirLight: new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(1, 1, 1) }),
	Init() {
		this.ShadowDistance = this.OriginShadowDis;
		this.LightIntensity = this.OriginLightIntensity;
		this.LightTemp = this.OriginLightTemp;
		this.Color = this.OriginColor;
	},
	SetSure() {
		this.OriginShadowDis = this.ShadowDistance;
		this.OriginLightIntensity = this.LightIntensity;
		this.OriginLightTemp = this.LightTemp;
		this.OriginColor = this.Color;
	},
});
export const SunLightSettings = reactive({
	// <!--阴影可见距离-->
	ShadowDistance: 5000,
	OriginShadowDis: 5000,
	// <!--光强-->
	LightIntensity: 2,
	OriginLightIntensity: 2,
	// <!--色温-->
	LightTemp: 6500,
	OriginLightTemp: 6500,
	// <!--颜色rgb-->
	Color: Cesium.Color.WHITE,
	OriginColor: Cesium.Color.WHITE,
	DirLight: new Cesium.DirectionalLight({ direction: new Cesium.Cartesian3(1, 1, 1) }),
	Init() {
		this.ShadowDistance = this.OriginShadowDis;
		this.LightIntensity = this.OriginLightIntensity;
		this.LightTemp = this.OriginLightTemp;
		this.Color = this.OriginColor;
	},
	SetSure() {
		this.OriginShadowDis = this.ShadowDistance;
		this.OriginLightIntensity = this.LightIntensity;
		this.OriginLightTemp = this.LightTemp;
		this.OriginColor = this.Color;
	},
});
[MoonLightSettings, SunLightSettings].forEach((item) => {
	Object.defineProperty(item, "UiColor", {
		get: function () {
			return this.Color.toCssColorString();
		},
		set: function (value) {
			this.Color = Cesium.Color.fromCssColorString(value);
			// alert(this.Color)
		},
	});
});
