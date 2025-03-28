/**
 * @Author: dongnan
 * @Description: 测量
 * @Date: 2021-11-11 15:30:10
 * @param {*} viewer
 */
import MessageModal from "@/utils/plugins/modal.js";
export default class MeasureTool {
	constructor(option) {
		this.viewer = option.viewer;
		this.handler = null; //绑定帮手 destory()销毁
		this.MeasureEntities = []; //存储所有entity数据
		// 提示框
		this.CesiumTooltip = new TooltipLabel({ viewer: option.viewer });
		//去锯齿 是文字清晰
		this.viewer.scene.postProcessStages.fxaa.enabled = false;
		// 线
		this.totalDistance = 0; //总距离
		this.events = []; //事件集合
	}
	// 绘制倒角标签
	drawLabelCanvas(lon, lat, height) {
		return new Promise((resolve, reject) => {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			canvas.width = 180;
			canvas.height = 100;
			// -------------绘制背景----------
			// 填充背景
			let x = 0;
			let y = 0;
			let w = canvas.width;
			let h = canvas.height;
			let r = 6;
			// 缩放
			context.scale(1, 1);
			context.fillStyle = "rgba(7,21,47,0.8)";
			// 绘制圆角矩形
			context.beginPath();
			context.moveTo(x + r, y);
			context.arcTo(x + w, y, x + w, y + h, r);
			context.arcTo(x + w, y + h, x, y + h, r);
			context.arcTo(x, y + h, x, y, r);
			context.arcTo(x, y, x + w, y, r);
			// 设置阴影
			context.shadowColor = "rgba(0, 0, 0, 0.2)"; // 颜色
			context.shadowBlur = 2; // 模糊尺寸
			context.shadowOffsetX = 2; // 阴影Y轴偏移
			context.shadowOffsetY = 2; // 阴影X轴偏移
			context.closePath();
			context.fill();
			// -----------结束背景绘制--------
			// -----------填充文字-----------
			let font = "14px sans-serif";
			let fillStyle = "#fff";
			let strokeStyle = "#fff";
			let fontSize = 14;
			document.fonts.load(font);
			document.fonts.ready.then(() => {
				context.font = font;
				context.lineWidth = 1;
				context.fillStyle = fillStyle;
				context.strokeStyle = strokeStyle;
				// context.textAlign = "center";
				let text1 = `经度：${lon.toFixed(6)}`;
				let text2 = `纬度：${lat.toFixed(6)}`;
				let text3 = `高度：${height.toFixed(2)}米`;
				let textWidth1 = context.measureText(text1).width;
				let textWidth2 = context.measureText(text2).width;
				let textWidth3 = context.measureText(text3).width;
				context.fillText(text1, (canvas.width - textWidth1) / 2, 30);
				context.fillText(text2, (canvas.width - textWidth1) / 2, 55);
				context.fillText(text3, (canvas.width - textWidth1) / 2, 80);
				// context.strokeText(text, canvas.width / 2 + padding[1], fontSize + padding[0]);
				resolve(canvas);
			});
		});
	}
	// 添加点弹框
	addPointPopup(viewer, option) {
		let htmlOverlay = document.createElement("div");
		htmlOverlay.innerHTML = option.html;
		viewer.cesiumWidget.container.append(htmlOverlay);
		let popupDom = htmlOverlay.querySelector(".PointPopup");
		let animateEvent = function (scene, time) {
			let position = Cesium.Cartesian3.fromDegrees(
				parseFloat(option.position[0]),
				parseFloat(option.position[1]),
				parseFloat(option.position[2]),
			);
			let canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
			if (Cesium.defined(canvasPosition)) {
				htmlOverlay.style.position = "absolute";
				htmlOverlay.style.top = canvasPosition.y - popupDom.clientHeight - 32 + "px";
				htmlOverlay.style.left = canvasPosition.x - popupDom.clientWidth / 2 + "px";
			}
		};
		viewer.scene.postUpdate.addEventListener(animateEvent);
		let copyElement = htmlOverlay.querySelector(".copy");
		copyElement.onclick = async function () {
			try {
				const textToCopy = option.position.join(",");
				await navigator.clipboard.writeText(textToCopy);
				MessageModal.msgSuccess("已复制到剪切板");
			} catch (err) {
				console.error("Failed to copy: ", err);
			}
		};
		return animateEvent;
	}
	/**
	 * @Author: dongnan
	 * @Description: 画点
	 * @Date: 2021-06-03 13:36:05
	 */
	drawPoint(complete) {
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 局部参数
		let point = null;
		//绑定鼠标点击事件
		this.handler.setInputAction(async (movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			let object = cartesian3ToDegrees(cartesian);
			let text = object.text;
			cartesian = object.cartesian;
			// 添加撒点
			this.MeasureEntities.push(
				this.viewer.entities.add({
					position: cartesian,
					billboard: {
						image: new URL("./assets/red.png", import.meta.url).href,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
					},
				}),
			);
			let imgUrl = new URL("./assets/copy.png", import.meta.url).href;
			let html = `<div class="PointPopup">
					<p class="row">
						<span class="leftLabel"> 经度： </span>
						<span class="rightContent"> ${object.lon.toFixed(6)} </span>
					</p>
					<p class="row">
						<span class="leftLabel"> 纬度： </span>
						<span class="rightContent">  ${object.lat.toFixed(6)} </span>
					</p>
					<p class="row">
						<span class="leftLabel"> 高度： </span>
						<span class="rightContent">  ${object.height.toFixed(2)} 米 <img src="${imgUrl}" alt="" class="copy" /> </span>
					</p>
				</div>`;
			this.events.push(
				this.addPointPopup(this.viewer, {
					html: html,
					position: [object.lon, object.lat, object.height],
				}),
			);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (point) {
				this.CesiumTooltip.showAt(cartesian, "右键结束");
			} else {
				this.CesiumTooltip.showAt(cartesian, "点击测量点坐标");
			}
			if (!point) {
				point = new PointEntity({
					viewer: this.viewer,
					position: cartesian,
					saveData: this.MeasureEntities,
				});
			} else {
				// 更新数据
				point.position = cartesian;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		//绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 清除点
			point.clear();
			this.stopDraw();
			if (typeof complete == "function") complete();
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 绘制高差
	 * @Date: 2021-06-03 13:36:05
	 */
	drawHeight(complete) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 实线的点
		let heightLine = null; //全局变量、默认空
		let clickItem = 0;
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			// let ray = this.viewer.camera.getPickRay(movement.position);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			clickItem += 1;
			if (clickItem == 1) {
				// 初始存储两点 便于move事件使用
				positions.push(cartesian);
				positions.push(cartesian.clone());
			} else if (clickItem == 2) {
				clickItem = 0;
				// 添加结束实线并清除虚线
				heightLine.clear();
				// 事件销毁
				this.stopDraw();
				if (typeof complete == "function") complete();
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			// let ray = this.viewer.camera.getPickRay(movement.endPosition);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (clickItem == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (clickItem == 1) {
				this.CesiumTooltip.showAt(cartesian, "点击结束测量");
				if (!Cesium.defined(heightLine)) {
					heightLine = new HeightLineEntity({
						viewer: this.viewer,
						positions: positions,
						saveData: this.MeasureEntities,
					});
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画线
	 * @Date: 2021-05-31 14:27:42
	 */
	drawLine(complete) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 实线的点
		let movePositions = []; //虚线的点
		let polyLine = null; //全局变量、默认空
		this.totalDistance = 0;
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			// let ray = this.viewer.camera.getPickRay(movement.position);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (positions.length == 0) {
				// 初始存储两点 便于move事件使用
				positions.push(cartesian);
				positions.push(cartesian.clone());
				movePositions.push(cartesian);
				movePositions.push(cartesian.clone());
				// 添加初始点entity
				// this.MeasureEntities.push(
				// 	this.viewer.entities.add({
				// 		position: cartesian,
				// 		point: {
				// 			pixelSize: 10,
				// 			color: Cesium.Color.GREEN,
				// 			disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// 			// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				// 		},
				// 	}),
				// );
			} else {
				// 去除positions初始赋予的重复值,保证点的纯净
				if (positions[0] === movePositions[0]) {
					positions.splice(0, 1);
				}
				// 数据重新存储
				let moveEndPosition = movePositions[1];
				positions.push(moveEndPosition);
				movePositions = [moveEndPosition, moveEndPosition.clone()];
				// 更新线数据
				polyLine.positions = positions;
				polyLine.movePositions = movePositions;
				// 添加中间点及标注
				this.addLabelEntity(positions[positions.length - 2], positions[positions.length - 1], "middle");
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			// let ray = this.viewer.camera.getPickRay(movement.endPosition);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (positions.length == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (positions.length >= 2) {
				this.CesiumTooltip.showAt(cartesian, "右击结束测量");
				if (!Cesium.defined(polyLine)) {
					polyLine = new PolyLineEntity({
						viewer: this.viewer,
						positions: positions,
						movePositions: movePositions,
						saveData: this.MeasureEntities,
					});
				} else {
					movePositions.pop();
					movePositions.push(cartesian);
				}
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		// 绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 添加结束实线并清除虚线
			positions.push(movePositions[1]);
			polyLine.positions = positions;
			polyLine.clear();
			// 添加结束点及标注
			this.addLabelEntity(positions[positions.length - 2], positions[positions.length - 1], "end");
			// 事件销毁
			this.stopDraw();
			if (typeof complete == "function") complete();
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画面
	 * @Date: 2021-05-31 14:27:51
	 */
	drawPolygon(complete) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 全部点
		let polyGonPoints = []; //真实点
		let polyGon = null; //全局变量、默认空
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			// let ray = this.viewer.camera.getPickRay(movement.position);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (cartesian) {
				let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
				let lon = Cesium.Math.toDegrees(cartographic.longitude);
				let lat = Cesium.Math.toDegrees(cartographic.latitude);
				let height = cartographic.height;
				console.log("点击的经纬度坐标为: lon: " + lon + ", lat: " + lat + ", height: " + height);
			}
			if (positions.length == 0) {
				// 初始存储数据
				positions.push(cartesian);
				positions.push(cartesian.clone());
				// 真实点存储
				polyGonPoints.push(cartesian.clone());
				// 添加点
				// this.MeasureEntities.push(
				// 	this.viewer.entities.add({
				// 		position: polyGonPoints[polyGonPoints.length - 1],
				// 		point: {
				// 			pixelSize: 10,
				// 			color: Cesium.Color.GREEN,
				// 			disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// 			// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				// 		},
				// 	}),
				// );
			} else {
				// 数据更新
				let moveEndPosition = positions[positions.length - 1];
				polyGonPoints.push(moveEndPosition);
				positions = polyGonPoints.concat([moveEndPosition.clone()]);
				polyGon.positions = positions;
				// 添加点
				// this.MeasureEntities.push(
				// 	this.viewer.entities.add({
				// 		position: polyGonPoints[polyGonPoints.length - 1],
				// 		point: {
				// 			pixelSize: 10,
				// 			color: Cesium.Color.YELLOW,
				// 			disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// 			// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				// 		},
				// 	}),
				// );
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		// 绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			// let ray = this.viewer.camera.getPickRay(movement.endPosition);
			// let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (positions.length == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (positions.length >= 2) {
				if (polyGonPoints.length == 1) {
					this.CesiumTooltip.showAt(cartesian, "点击添加第二个点");
				} else {
					this.CesiumTooltip.showAt(cartesian, "右击结束");
				}
				if (!Cesium.defined(polyGon)) {
					polyGon = new PolygonEntity({
						viewer: this.viewer,
						positions: positions,
						saveData: this.MeasureEntities,
					});
				} else {
					positions.pop();
					positions.push(cartesian.clone());
				}
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		// 绑定鼠标右击事件
		this.handler.setInputAction((movement) => {
			// 更新面数据
			let moveEndPosition = positions[positions.length - 1];
			polyGonPoints.push(moveEndPosition);
			polyGon.positions = polyGonPoints;
			polyGon.clear();
			// 添加点
			// this.MeasureEntities.push(
			// 	this.viewer.entities.add({
			// 		position: polyGonPoints[polyGonPoints.length - 1],
			// 		point: {
			// 			pixelSize: 10,
			// 			color: Cesium.Color.RED,
			// 			disableDepthTestDistance: Number.POSITIVE_INFINITY,
			// 			// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			// 		},
			// 	}),
			// );
			// 事件销毁
			this.stopDraw();
			if (typeof complete == "function") complete();
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画圆
	 * @Date: 2021-06-03 16:37:59
	 */
	drawCircle() {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; //点集合
		let clickNum = 0; //点击次数
		let circle = null; //全局变量、默认空
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			if (clickNum == 0) {
				positions.push(cartesian);
				positions.push(cartesian.clone());
			} else if (clickNum == 1) {
				positions = [positions[0]].concat([positions[positions.length - 1]]);
				circle.positions = positions;
				circle.clear();
				this.stopDraw();
			}
			clickNum += 1;
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		// 绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (clickNum == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (clickNum >= 1) {
				this.CesiumTooltip.showAt(cartesian, "点击完成绘制");
				if (!Cesium.defined(circle)) {
					circle = new CircleEntity({
						viewer: this.viewer,
						positions: positions,
						saveData: this.MeasureEntities,
					});
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-05-31 14:59:33
	 */
	clear() {
		// 去除事件
		this.stopDraw();
		// 去除数据
		this.MeasureEntities.some((item) => {
			if (item) {
				this.viewer.entities.remove(item);
			}
		});
		this.MeasureEntities = [];
		// 去除弹框事件
		this.events.some((item) => {
			if (item) {
				this.viewer.scene.postUpdate.removeEventListener(item);
			}
		});
		this.events = [];
		// 清除已显示的弹框
		let popups = this.viewer.cesiumWidget.container.querySelectorAll(".PointPopup");
		for (let pop of popups) {
			this.viewer.cesiumWidget.container.removeChild(pop.parentElement);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 结束绘制
	 * @Date: 2021-05-31 14:44:07
	 */
	stopDraw() {
		// 去除事件
		if (this.handler) {
			this.handler.destroy();
			this.handler = null;
		}
		// 隐藏提示框
		this.CesiumTooltip.setVisible(false);
	}
	/**
	 * @Author: dongnan
	 * @Description: 添加点及标注
	 * @Date: 2021-05-31 22:10:32
	 * @param {*} startPoint
	 * @param {*} endPoint
	 */
	addLabelEntity(startPoint, endPoint, type) {
		// 根据点类型判断点颜色
		let colorType = Cesium.Color.YELLOW;
		if (type == "end") {
			colorType = Cesium.Color.RED;
		}
		// 计算距离并保留两位小数 单位m
		let distance = parseInt(getLineDistance(startPoint, endPoint));
		this.totalDistance += distance;
		let distanceText = labelLineTransform(distance);
		let totalText = labelLineTransform(this.totalDistance);
		// 添加点及标注 并存储
		this.MeasureEntities.push(
			this.viewer.entities.add({
				position: endPoint,
				// point: {
				// 	pixelSize: 10,
				// 	color: colorType,
				// 	disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// 	// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				// },
				label: {
					text: "+ " + distanceText + "\n",
					font: "normal 26px Times New Roman",
					fillColor: Cesium.Color.fromCssColorString("#00FF00"),
					pixelOffset: new Cesium.Cartesian2(80, -15),
					horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
					scale: 0.5,
					showBackground: true,
					backgroundPadding: new Cesium.Cartesian2(15, 10),
					backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				},
			}),
			this.viewer.entities.add({
				position: endPoint,
				label: {
					text: " " + totalText,
					font: "normal 26px Times New Roman",
					fillColor: Cesium.Color.WHITE,
					pixelOffset: new Cesium.Cartesian2(72, -10),
					horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
					scale: 0.5,
					showBackground: false,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
					// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				},
			}),
		);
	}
}
/**
 * @Author: dongnan
 * @Description: 提示标签
 * @Date: 2021-11-11 15:27:46
 * @param {*} viewer
 */
class TooltipLabel {
	constructor(option) {
		this.viewer = option.viewer;
		this.labelEntity = this.viewer.entities.add({
			position: Cesium.Cartesian3.fromDegrees(0, 0),
			label: {
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				text: "提示",
				font: "24px Microsoft YaHei",
				scale: 0.5,
				fillColor: Cesium.Color.WHITE,
				pixelOffset: new Cesium.Cartesian2(8, 8),
				horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(4, 8),
				backgroundColor: new Cesium.Color(0, 0, 0, 0.5),
			},
		});
		this.labelEntity.show = false;
	}
	/**
	 * @Author: dongnan
	 * @Description: 设置显示隐藏
	 * @Date: 2021-11-11 15:27:25
	 * @param {*} visible
	 */
	setVisible(visible) {
		this.labelEntity.show = visible ? true : false;
	}
	/**
	 * @Author: dongnan
	 * @Description: 展示位置
	 * @Date: 2021-11-11 15:27:33
	 * @param {*} position
	 * @param {*} message
	 */
	showAt(position, message) {
		if (position && message) {
			this.labelEntity.position = position;
			this.labelEntity.show = true;
			this.labelEntity.label.text = message;
		} else {
			this.labelEntity.show = false;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 点Entity
 * @Date: 2021-11-11 15:47:18
 * @param {*} viewer
 * @param {*} position
 * @param {*} saveData
 */
class PointEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.position = option.position;
		this.saveData = option.saveData;
		this.movePoint = this.viewer.entities.add({
			position: new Cesium.CallbackProperty(() => {
				return this.position;
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2021-11-11 15:45:04
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 高度测量
 * @Date: 2021-11-11 16:44:10
 * @param {*} viewer
 * @param {*} positions
 * @param {*} saveData
 */
class HeightLineEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.saveData = option.saveData;
		//实线点位
		this.positions = option.positions;
		//实线实体
		this.polyLine = this.viewer.entities.add({
			name: "实线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					return this.positions.concat([]);
				}, false),
				material: Cesium.Color.fromCssColorString("#00FA9A"),
				width: 3,
				clampToGround: false,
				// classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		//虚线实体
		this.movePolyLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					let transformObj = this.transformPositions(this.positions.concat([]));
					let newPositions = transformObj.positions;
					return newPositions;
				}, false),
				material: new Cesium.PolylineDashMaterialProperty({
					color: Cesium.Color.fromCssColorString("#00FA9A"),
				}),
				width: 3,
				clampToGround: false,
				// classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		//点实体
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				let point = this.positions[1].clone();
				return point;
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.fromCssColorString("#00FA9A"),
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.ClassificationType.BOTH,
			},
		});
		this.labelPoint1 = this.viewer.entities.add({
			position: new Cesium.CallbackProperty(() => {
				let result = Cesium.Cartesian3.midpoint(this.positions[0], this.positions[1], new Cesium.Cartesian3());
				return result;
			}, false),
			label: {
				text: new Cesium.CallbackProperty(() => {
					let distance = parseInt(getLineSpaceDistance(this.positions[0], this.positions[1]));
					let text = labelLineTransform(distance);
					text = "空间距离：" + text;
					return text;
				}, false),
				font: "normal 24px Times New Roman",
				fillColor: Cesium.Color.fromCssColorString("#00FF00"),
				pixelOffset: new Cesium.Cartesian2(0, 0),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				scale: 0.5,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(10, 10),
				backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});
		this.labelPoint2 = this.viewer.entities.add({
			position: new Cesium.CallbackProperty(() => {
				let transformObj = this.transformPositions(this.positions.concat([]));
				let newPositions = transformObj.positions;
				let result = Cesium.Cartesian3.midpoint(newPositions[0], newPositions[1], new Cesium.Cartesian3());
				return result;
			}, false),
			label: {
				text: new Cesium.CallbackProperty(() => {
					let transformObj = this.transformPositions(this.positions.concat([]));
					let distance = transformObj.height;
					let text = labelLineTransform(parseInt(distance));
					text = "垂直距离：" + text;
					return text;
				}, false),
				font: "normal 24px Times New Roman",
				fillColor: Cesium.Color.fromCssColorString("#00FF00"),
				pixelOffset: new Cesium.Cartesian2(0, 0),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				scale: 0.5,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(10, 10),
				backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});
		this.labelPoint3 = this.viewer.entities.add({
			position: new Cesium.CallbackProperty(() => {
				let transformObj = this.transformPositions(this.positions.concat([]));
				let newPositions = transformObj.positions;
				let result = Cesium.Cartesian3.midpoint(newPositions[1], newPositions[2], new Cesium.Cartesian3());
				return result;
			}, false),
			label: {
				text: new Cesium.CallbackProperty(() => {
					let transformObj = this.transformPositions(this.positions.concat([]));
					let newPositions = transformObj.positions;
					let distance = parseInt(getLineDistance(newPositions[1], newPositions[2]));
					let text = labelLineTransform(distance);
					text = "水平距离：" + text;
					return text;
				}, false),
				font: "normal 24px Times New Roman",
				fillColor: Cesium.Color.fromCssColorString("#00FF00"),
				pixelOffset: new Cesium.Cartesian2(0, 0),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				scale: 0.5,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(10, 10),
				backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});
		this.saveData.push(this.polyLine);
		this.saveData.push(this.movePolyLine);
		this.saveData.push(this.movePoint);
		this.saveData.push(this.labelPoint1);
		this.saveData.push(this.labelPoint2);
		this.saveData.push(this.labelPoint3);
	}
	// 转换
	transformPositions(positions) {
		let list = [];
		positions.some((item) => {
			let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(item);
			let lon = Cesium.Math.toDegrees(cartographic.longitude);
			let lat = Cesium.Math.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			list.push([lon, lat, height]);
		});
		let heightDistance = list[0][2] - list[1][2];
		// debugger;
		// console.log(heightDistance);
		let newPositions = [];
		if (heightDistance > 0) {
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[1][0], list[1][1], list[1][2]));
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[1][0], list[1][1], list[0][2]));
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[0][0], list[0][1], list[0][2]));
		} else {
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[0][0], list[0][1], list[0][2]));
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[0][0], list[0][1], list[1][2]));
			newPositions.push(Cesium.Cartesian3.fromDegrees(list[1][0], list[1][1], list[1][2]));
		}
		let obj = {
			positions: newPositions,
			height: Math.abs(heightDistance),
		};
		return obj;
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 16:49:50
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 线Entity
 * @Date: 2021-11-11 16:44:10
 * @param {*} viewer
 * @param {*} positions
 * @param {*} movePositions
 * @param {*} saveData
 */
class PolyLineEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.saveData = option.saveData;
		//实线点位
		this.positions = option.positions;
		//虚线点位
		this.movePositions = option.movePositions;
		//实线实体
		this.polyLine = this.viewer.entities.add({
			name: "实线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					return this.positions;
				}, false),
				material: Cesium.Color.fromCssColorString("#00FA9A"),
				width: 3,
				clampToGround: true,
				classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		//虚线实体
		this.movePolyLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					return this.movePositions;
				}, false),
				material: new Cesium.PolylineDashMaterialProperty({
					color: Cesium.Color.fromCssColorString("#00FA9A"),
				}),
				width: 3,
				clampToGround: true,
				classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		//点实体
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				let point = this.movePositions[1].clone();
				return point;
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.fromCssColorString("#00FA9A"),
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.ClassificationType.BOTH,
			},
		});
		this.saveData.push(this.polyLine);
		this.saveData.push(this.movePolyLine);
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 16:49:50
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
	}
}

/**
 * @Author: dongnan
 * @Description: 圆Entity
 * @Date: 2021-11-11 21:42:25
 * @param {*} viewer
 * @param {*} positions
 * @param {*} height
 * @param {*} saveData
 */
class CircleEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.positions = option.positions;
		this.saveData = option.saveData;
		this.circle = this.viewer.entities.add({
			name: "圆",
			position: this.positions[0],
			ellipse: {
				semiMinorAxis: new Cesium.CallbackProperty(() => {
					let meters = getLineDistance(this.positions[0], this.positions[1]);
					if (!meters) meters = 1;
					return meters;
				}, false),
				semiMajorAxis: new Cesium.CallbackProperty(() => {
					let meters = getLineDistance(this.positions[0], this.positions[1]);
					if (!meters) meters = 1;
					return meters;
				}, false),
				material: Cesium.Color.BLUE.withAlpha(0.4),
				outline: true,
				outlineColor: Cesium.Color.CYAN,
				outlineWidth: 10,
				granularity: Cesium.Math.RADIANS_PER_DEGREE,
				classificationType: Cesium.ClassificationType.BOTH,
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.movePolyLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					return this.positions;
				}, false),
				material: new Cesium.PolylineDashMaterialProperty({
					color: Cesium.Color.BLACK,
				}),
				width: 3,
				clampToGround: true,
				classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				return this.positions[1];
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.HeightReference.NONE,
			},
		});
		this.labelPoint = this.viewer.entities.add({
			name: "面积标注",
			position: this.positions[0],
			label: {
				text: new Cesium.CallbackProperty(() => {
					let text = "";
					let radius = getLineDistance(this.positions[0], this.positions[1]);
					let area = parseInt(Math.PI * Math.pow(radius, 2));
					text = labelAreaTransform(area);
					return text;
				}, false),
				font: "normal 24px Times New Roman",
				fillColor: Cesium.Color.GREEN,
				pixelOffset: new Cesium.Cartesian2(0, -20),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				scale: 0.5,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(15, 10),
				backgroundColor: Cesium.Color.fromCssColorString("#c6c691"),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.circle);
		this.saveData.push(this.movePoint);
		this.saveData.push(this.labelPoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 21:46:55
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 面Entity
 * @Date: 2021-11-11 21:02:48
 * @param {Cesium.Viewer} viewer
 * @param {Array} positions [cartesian3]
 * @param {Array} saveData
 */
class PolygonEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.positions = option.positions; //全部点位
		this.saveData = option.saveData;
		this.polyGon = this.viewer.entities.add({
			name: "多边形",
			polygon: {
				show: true,
				hierarchy: new Cesium.CallbackProperty(() => {
					return new Cesium.PolygonHierarchy(this.positions);
				}, false),
				material: Cesium.Color.BLUE.withAlpha(0.4),
				classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		this.moveLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					let positions = [];
					if (this.positions.length >= 3) {
						positions = this.positions.concat([this.positions[0].clone()]);
					} else {
						positions = this.positions.concat();
					}
					return positions;
				}, false),
				material: new Cesium.PolylineDashMaterialProperty({
					color: Cesium.Color.fromCssColorString("#00FA9A"),
				}),
				width: 3,
				clampToGround: true,
				classificationType: Cesium.ClassificationType.BOTH,
			},
		});
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				let point = this.positions[this.positions.length - 1].clone();
				return point;
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.fromCssColorString("#00FA9A"),
				outlineWidth: 2,
				// disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.labelPoint = this.viewer.entities.add({
			name: "面积标注",
			position: new Cesium.CallbackProperty(() => {
				let center = new Cesium.Cartesian3();
				if (this.positions.length >= 3) {
					let positions = this.positions.concat();
					center = calculateCenter(positions);
				}
				return center;
			}, false),
			label: {
				text: new Cesium.CallbackProperty(() => {
					let text = "";
					if (this.positions.length >= 3) {
						let positions = this.positions.concat();
						let area = parseInt(countAreaInCartesian3(positions));
						text = labelAreaTransform(area);
					}
					return text;
				}, false),
				font: "normal 30px Times New Roman",
				fillColor: Cesium.Color.fromCssColorString("#00FF00"),
				pixelOffset: new Cesium.Cartesian2(0, -20),
				horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
				scale: 0.5,
				showBackground: true,
				backgroundPadding: new Cesium.Cartesian2(15, 15),
				backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				// heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.polyGon);
		this.saveData.push(this.moveLine);
		this.saveData.push(this.movePoint);
		this.saveData.push(this.labelPoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 21:11:23
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePoint);
	}
}
// 计算中心点
function calculateCenter(positions) {
	let center = Cesium.BoundingSphere.fromPoints(positions).center;
	let height = 0;
	positions.some((item) => {
		let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(item);
		height += cartographic.height;
	});
	let cartographic2 = Cesium.Ellipsoid.WGS84.cartesianToCartographic(center);
	let lon2 = Cesium.Math.toDegrees(cartographic2.longitude);
	let lat2 = Cesium.Math.toDegrees(cartographic2.latitude);
	height = height / positions.length;
	center = Cesium.Cartesian3.fromDegrees(lon2, lat2, height);
	return center;
}
/**
 * @Author: dongnan
 * @Description: 改变笛卡尔坐标高度
 * @Date: 2021-05-31 16:20:14
 * @param {*} cartesian
 * @param {*} height
 */
function cartesianWithHeight(cartesian, height) {
	height = Cesium.defaultValue(height, 0);
	let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
	return Cesium.Cartesian3.fromDegrees((cartographic.longitude / Math.PI) * 180, (cartographic.latitude / Math.PI) * 180, height);
}
/**
 * @Author: dongnan
 * @Description: 笛卡尔坐标转经纬度坐标
 * @Date: 2021-06-03 14:53:05
 * @param {*} cartesian
 */
function cartesian3ToDegrees(cartesian) {
	let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
	let lon = Cesium.Math.toDegrees(cartographic.longitude);
	let lat = Cesium.Math.toDegrees(cartographic.latitude);
	let height = cartographic.height;
	if (height < 0) {
		height = 0;
		cartesian = cartesianWithHeight(cartesian, 0);
	}
	let text = "经纬度:" + lon.toFixed(2) + " , " + lat.toFixed(2) + "   海拔:" + height.toFixed(2) + "m";

	return { text, cartesian, lon, lat, height };
}
/**
 * @Author: dongnan
 * @Description: 获取俩点的距离，返回m
 * @Date: 2021-01-14 11:35:27
 * @param {*} startPoint
 * @param {*} endPoint
 */
function getLineDistance(startPoint, endPoint) {
	let startCartographic = Cesium.Cartographic.fromCartesian(startPoint);
	let endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
	let geodesic = new Cesium.EllipsoidGeodesic();
	geodesic.setEndPoints(startCartographic, endCartographic);
	let surfaceDistance = geodesic.surfaceDistance;
	// let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));//带高度
	let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2)); //忽视高度
	return lengthInMeters;
}
/**
 * @Author: dongnan
 * @Description: 获取俩点的距离，返回m
 * @Date: 2021-01-14 11:35:27
 * @param {*} startPoint
 * @param {*} endPoint
 */
function getLineSpaceDistance(startPoint, endPoint) {
	let startCartographic = Cesium.Cartographic.fromCartesian(startPoint);
	let endCartographic = Cesium.Cartographic.fromCartesian(endPoint);
	let geodesic = new Cesium.EllipsoidGeodesic();
	geodesic.setEndPoints(startCartographic, endCartographic);
	let surfaceDistance = geodesic.surfaceDistance;
	let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2)); //带高度
	// let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2)); //忽视高度
	return lengthInMeters;
}
/**
 * @Author: dongnan
 * @Description: 微元法求面积 m²
 * @Date: 2021-01-15 16:35:41
 * @param {*} cartesians 笛卡尔坐标数组
 */
function countAreaInCartesian3(cartesians) {
	//拆分三角曲面
	let area = 0;
	let lonLatPoints = cartesianToLonLat(cartesians);
	for (let i = 0; i < lonLatPoints.length - 2; i++) {
		let j = (i + 1) % lonLatPoints.length;
		let k = (i + 2) % lonLatPoints.length;
		let totalAngle = Angle(lonLatPoints[i], lonLatPoints[j], lonLatPoints[k]);
		let dis_temp1 = getLineDistance(cartesians[i], cartesians[j]);
		let dis_temp2 = getLineDistance(cartesians[j], cartesians[k]);
		area += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
	}
	return area;
	/**
	 * @Author: dongnan
	 * @Description: 笛卡尔坐标数组转为[{lon:111.23,lat:23.34,height:height}]
	 * @Date: 2021-06-04 22:41:15
	 * @param {*} cartesians
	 */
	function cartesianToLonLat(cartesians) {
		let result = [];
		for (let cartesian of cartesians) {
			let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
			let lon = Cesium.Math.toDegrees(cartographic.longitude);
			let lat = Cesium.Math.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			result.push({
				lon: lon,
				lat: lat,
				height: height,
			});
		}
		return result;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算三角形角度
	 * @Date: 2021-06-04 22:35:26
	 * @param {*} p1
	 * @param {*} p2
	 * @param {*} p3
	 */
	function Angle(p1, p2, p3) {
		let bearing21 = Bearing(p2, p1);
		let bearing23 = Bearing(p2, p3);
		let angle = bearing21 - bearing23;
		if (angle < 0) {
			angle += 360;
		}
		return angle;
		/**
		 * @Author: dongnan
		 * @Description: 计算两点方向
		 * @Date: 2021-06-04 22:35:00
		 * @param {*} from
		 * @param {*} to
		 */
		function Bearing(from, to) {
			let radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad)
			let degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度
			let lat1 = from.lat * radiansPerDegree;
			let lon1 = from.lon * radiansPerDegree;
			let lat2 = to.lat * radiansPerDegree;
			let lon2 = to.lon * radiansPerDegree;
			let angle = -Math.atan2(
				Math.sin(lon1 - lon2) * Math.cos(lat2),
				Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2),
			);
			if (angle < 0) {
				angle += Math.PI * 2.0;
			}
			angle = angle * degreesPerRadian; //角度
			return angle;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 传入整数米
 * @Date: 2021-06-05 16:11:56
 * @param {*} num
 */
function labelLineTransform(num) {
	let str = String(num);
	let text = "";
	if (str.length < 4) {
		text = str + " m";
	} else {
		if (str.length < 8) {
			str = String(str / 1000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " km";
		} else {
			str = String(str / 10000000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " 万km";
		}
	}
	return text;
}
/**
 * @Author: dongnan
 * @Description: 传入整数平方米 m²
 * @Date: 2021-06-05 16:11:56
 * @param {*} num
 */
function labelAreaTransform(num) {
	let str = String(num);
	let text = "";
	if (str.length < 5) {
		text = str + " ㎡";
	} else {
		if (str.length < 7) {
			str = String(str / 10000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " h㎡"; //公顷
		} else {
			if (str.length < 11) {
				str = String(str / 1000000);
				str = str.substr(0, str.indexOf(".", 0) + 3);
				text = str + " k㎡";
			} else {
				str = String(str / 10000000000);
				str = str.substr(0, str.indexOf(".", 0) + 3);
				text = str + " 万k㎡";
			}
		}
	}
	return text;
}
