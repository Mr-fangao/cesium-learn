/**
 * @Author: dongnan
 * @Description: 辅助绘制点、线、面
 * @Date: 2021-11-11 15:30:10
 * @param {*} viewe	r
 */
import * as turf from "@turf/turf";
export default class DrawTool {
	constructor(option) {
		this.viewer = option.viewer;
		this.handler = null; //绑定帮手 destory()销毁
		this.MeasureEntities = []; //存储所有entity数据
		// 提示框
		this.CesiumTooltip = new TooltipLabel({ viewer: option.viewer });
		//去锯齿 是文字清晰
		// this.viewer.scene.postProcessStages.fxaa.enabled = false;
		// 列表插入
		Array.prototype.insert = function (index, item) {
			this.splice(index, 0, item);
		};
	}
	/**
	 * @Author: dongnan
	 * @Description: 画点
	 * @Date: 2021-06-03 13:36:05
	 */
	drawPoint(callback) {
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 局部参数
		let point = null;
		//绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
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
						// image: require("@/assets/images/cesium/point.png"),
						image: new URL("../assets/point.png", import.meta.url).href,
						horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
					},
				}),
			);
			if (typeof callback == "function") callback(cartesian);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (point) {
				this.CesiumTooltip.showAt(cartesian, "右击结束");
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
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画点
	 * @Date: 2021-06-03 13:36:05
	 */
	drawSinglePoint(callback, showPoint) {
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 局部参数
		let point = null;
		let pointEntity = null;
		//绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			let object = cartesian3ToDegrees(cartesian);
			let text = object.text;
			cartesian = object.cartesian;
			// 添加撒点
			point = cartesian;
			if (showPoint) {
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: cartesian,
						billboard: {
							// image: require("@/assets/images/cesium/point.png"),
							// image: getAssets("images/cesium/point.png"),
							image: new URL("../assets/point.png", import.meta.url).href,
							horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
							verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						},
					}),
				);
			}
			pointEntity.clear();
			this.stopDraw();
			if (typeof callback == "function") callback(cartesian);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (point) {
				this.CesiumTooltip.showAt(cartesian, "点击更新位置,右击结束");
			} else {
				this.CesiumTooltip.showAt(cartesian, "点击添加漫游点");
			}

			if (!pointEntity) {
				pointEntity = new PointEntity({
					viewer: this.viewer,
					position: cartesian,
					saveData: this.MeasureEntities,
				});
			} else {
				// 更新数据
				pointEntity.position = cartesian;
			}
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		//绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 清除点
			pointEntity.clear();
			this.stopDraw();
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画线
	 * @Date: 2021-05-31 14:27:42
	 */
	drawLine(option, complete, cancel) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 实线的点
		let movePositions = []; //虚线的点
		let polyLine = null; //全局变量、默认空
		let timer = null;
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			clearTimeout(timer);
			timer = window.setTimeout(() => {
				// let cartesian = this.viewer.scene.pickPosition(movement.position);
				let ray = this.viewer.camera.getPickRay(movement.position);
				let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
				if (!cartesian) return;
				if (positions.length == 0) {
					// 初始存储两点 便于move事件使用
					positions.push(cartesian);
					positions.push(cartesian.clone());
					movePositions.push(cartesian);
					movePositions.push(cartesian.clone());
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
				}
			}, 500);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			// let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			let ray = this.viewer.camera.getPickRay(movement.endPosition);
			let cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
			if (!cartesian) return;
			if (positions.length == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (positions.length >= 2) {
				this.CesiumTooltip.showAt(cartesian, "双击完成，右击取消");
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
		// 绑定鼠标双击事件
		this.handler.setInputAction((movement) => {
			clearTimeout(timer);
			// 添加结束实线并清除虚线
			let moveEndPosition = movePositions[1];
			positions.push(moveEndPosition);
			movePositions = [moveEndPosition, moveEndPosition.clone()];
			// 更新线数据
			polyLine.positions = positions;
			polyLine.movePositions = movePositions;
			polyLine.clear();
			this.stopDraw();
			if (typeof complete == "function") complete(polyLine, positions);
		}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
		// 绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 事件销毁
			this.stopDraw();
			polyLine.remove();
			if (typeof cancel == "function") cancel(positions);
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	// 编辑模型
	editModel(option) {
		let viewer = this.viewer;
		let leftDownFlag = false; // 鼠标左键是否按下
		let pickedEntity = null; //被选中的Entity
		viewer.screenSpaceEventHandler.setInputAction((e) => {
			leftDownAction(e);
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

		viewer.screenSpaceEventHandler.setInputAction((e) => {
			mouseMoveAction(e);
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		viewer.screenSpaceEventHandler.setInputAction((e) => {
			leftUpAction(e);
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
		// 拖拽模型-左键按下
		function leftDownAction(e) {
			leftDownFlag = true;
			let picked = viewer.scene.pick(e.position);
			if (picked) {
				document.body.style.cursor = "move";
				pickedEntity = Cesium.defaultValue(picked.id, picked.primitive.id);
				if (pickedEntity instanceof Cesium.Entity && pickedEntity.model) {
					//锁定相机
					viewer.scene.screenSpaceCameraController.enableRotate = false;
				}
			}
		}

		// 拖拽模型-鼠标移动
		function mouseMoveAction(e) {
			if (leftDownFlag && pickedEntity) {
				// let ray = viewer.camera.getPickRay(e.endPosition);
				// let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
				let cartesian = viewer.scene.camera.pickEllipsoid(e.endPosition, viewer.scene.globe.ellipsoid);
				pickedEntity.position = cartesian;
			}
		}

		// 拖拽模型-左键抬起
		function leftUpAction(e) {
			document.body.style.cursor = "default";
			leftDownFlag = false;
			pickedEntity = null;
			// 解除相机锁定
			viewer.scene.screenSpaceCameraController.enableRotate = true;
		}
	}
	// 编辑线
	editLine(option, complete) {
		let that = this;
		let leftDownFlag = false; // 鼠标左键是否按下
		let pickedEntity = null; //被选中的Entity
		let isEdit = false;
		let polyLine = option.line;
		if (!polyLine) return;
		let viewer = this.viewer;
		let nodePoints = polyLine.positions;
		let nodeEntities = [];
		let midPoints = [];
		let midEntities = [];
		let centerEntities = [];
		let centerPos;
		let arrowLength = 200;

		polyLine.positions = nodePoints;
		startEdit();
		// 绑定事件
		this.stopDraw();
		this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		this.handler.setInputAction((e) => {
			leftClickAction(e);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

		this.handler.setInputAction((e) => {
			if (isEdit) leftDownAction(e);
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

		this.handler.setInputAction((e) => {
			mouseMoveAction(e);
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

		this.handler.setInputAction((e) => {
			if (isEdit) leftUpAction(e);
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
		this.handler.setInputAction((e) => {
			if (isEdit) rightClickAction(e);
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
		// 开启编辑
		function startEdit() {
			viewer.scene.globe.depthTestAgainstTerrain = false;
			isEdit = true;
			clearArrow();
			createNodePoint();
			createMidPoint();
			createCenterPoint();
		}
		// 关闭编辑
		function endEdit() {
			viewer.scene.globe.depthTestAgainstTerrain = true;
			isEdit = false;
			clearNodePoint();
			clearCenterPoint();
			clearMidPoint();
			clearArrow();
			if (typeof complete == "function") complete(nodePoints);
		}
		// 左键单击事件
		function leftClickAction(e) {
			let picked = viewer.scene.pick(e.position);
			if (picked && picked.id && picked.id.type && picked.id.type == "CustomLine") {
				startEdit();
			} else {
				endEdit();
			}
		}
		// 拖拽模型-左键按下
		function leftDownAction(e) {
			leftDownFlag = true;
			let picked = viewer.scene.pick(e.position);
			let ray = viewer.camera.getPickRay(e.position);
			let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
			if (picked && picked.id && picked.id.type) {
				// debugger;
				document.body.style.cursor = "move";
				//锁定相机
				viewer.scene.screenSpaceCameraController.enableRotate = false;
				if (picked.id.type == "NodeVertex") {
					pickedEntity = picked.id;
					clearMidPoint();
				} else if (picked.id.type == "MidVertex") {
					pickedEntity = picked.id;
					nodePoints.insert(pickedEntity.vertexIndex + 1, pickedEntity.position._value);
				} else if (picked.id.type == "CenterVertex") {
					pickedEntity = picked.id;
					clearNodePoint();
					clearMidPoint();
				} else if (picked.id.type == "Axis") {
					pickedEntity = picked.id;
					clearNodePoint();
					clearMidPoint();
					clearCenterPoint();
				}
			}
		}

		// 拖拽模型-鼠标移动
		function mouseMoveAction(e) {
			let ray = viewer.camera.getPickRay(e.endPosition);
			let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
			// let cartesian = viewer.scene.pickPosition(e.endPosition);
			let picked = viewer.scene.pick(e.endPosition);
			if (cartesian) {
				if (picked && picked.id && picked.id.type && !leftDownFlag) {
					if (picked.id.type == "NodeVertex") {
						that.CesiumTooltip.showAt(cartesian, "右键删除节点");
					} else if (picked.id.type == "MidVertex") {
						that.CesiumTooltip.showAt(cartesian, "移动增加节点");
					} else if (picked.id.type == "CustomLine") {
						if (!isEdit) that.CesiumTooltip.showAt(cartesian, "点击开启编辑");
					} else if (picked.id.type == "CenterVertex") {
						that.CesiumTooltip.showAt(cartesian, "左键移动，右键开启坐标轴");
					} else {
						that.CesiumTooltip.setVisible(false);
					}
				} else {
					that.CesiumTooltip.setVisible(false);
				}
				if (leftDownFlag && pickedEntity) {
					if (pickedEntity.type == "NodeVertex") {
						pickedEntity.position = cartesian;
						if (Cesium.defined(nodePoints[pickedEntity.vertexIndex])) nodePoints[pickedEntity.vertexIndex] = cartesian;
					} else if (pickedEntity.type == "MidVertex") {
						pickedEntity.position = cartesian;
						if (Cesium.defined(nodePoints[pickedEntity.vertexIndex + 1])) nodePoints[pickedEntity.vertexIndex + 1] = cartesian;
					} else if (pickedEntity.type == "CenterVertex") {
						moveEntityByOffset(pickedEntity.position._value, cartesian);
						pickedEntity.position = cartesian;
					} else if (pickedEntity.type == "Axis") {
						let type = pickedEntity.id;
						let startPos = viewer.scene.pickPosition(e.startPosition);
						let endPos = cartesian.clone();
						let endLon = cartesianToLonlat(endPos);
						let startLon = cartesianToLonlat(startPos);
						let centerLon = cartesianToLonlat(centerPos);
						if (type == "AxisX") {
							let offsetX = endLon[0] - startLon[0];
							centerLon[0] += offsetX;
						} else if (type == "AxisY") {
							let offsetY = endLon[1] - startLon[1];
							centerLon[1] += offsetY;
						} else if (type == "AxisZ") {
							//高度调整
							let pixel_difference = e.endPosition.y - e.startPosition.y;
							let temp = 10;
							//pixel_difference > 0高度减少  pixel_difference < 0 高度增加
							centerLon[2] -= temp * pixel_difference;
						}
						let newPos = Cesium.Cartesian3.fromDegrees(centerLon[0], centerLon[1], centerLon[2]);
						updateArrow(newPos, type);
						moveEntityByOffset(centerPos, newPos);
						centerPos = newPos.clone();
					}
				}
			} else {
				that.CesiumTooltip.setVisible(false);
			}

			//根据偏移量移动实体
			function moveEntityByOffset(startPosition, endPosition) {
				let startPoint3d = cartesianToLonlat(startPosition);
				let endPoint3d = cartesianToLonlat(endPosition);
				let offsetX = endPoint3d[0] - startPoint3d[0];
				let offsetY = endPoint3d[1] - startPoint3d[1];
				let offsetZ = endPoint3d[2] - startPoint3d[2];

				//设置偏移量
				let element, point3d;
				for (let i = 0; i < nodePoints.length; i++) {
					element = cartesianToLonlat(nodePoints[i]);
					element[0] += offsetX;
					element[1] += offsetY;
					element[2] += offsetZ;
					nodePoints[i] = Cesium.Cartesian3.fromDegrees(element[0], element[1], element[2]);
				}
				// this.militaryPlot.setPoints(point3dsToPoint2ds(this.editPositions));
			}
		}

		// 拖拽模型-左键抬起
		function leftUpAction(e) {
			if (pickedEntity && pickedEntity.type && pickedEntity.type == "Axis") {
				updateArrow(centerPos);
			} else if (pickedEntity && pickedEntity.type && pickedEntity.type != "Axis") {
				clearNodePoint();
				clearCenterPoint();
				clearMidPoint();
				createNodePoint();
				createMidPoint();
				createCenterPoint();
			}
			pickedEntity = null;

			document.body.style.cursor = "default";
			leftDownFlag = false;
			// 解除相机锁定
			viewer.scene.screenSpaceCameraController.enableRotate = true;
		}
		// 右键
		function rightClickAction(e) {
			let picked = viewer.scene.pick(e.position);
			if (picked && picked.id && picked.id.type) {
				if (picked.id.type == "NodeVertex") {
					nodePoints.splice(picked.id.vertexIndex, 1);
					clearNodePoint();
					clearCenterPoint();
					clearMidPoint();
					createNodePoint();
					createMidPoint();
					createCenterPoint();
				} else if (picked.id.type == "CenterVertex") {
					centerPos = picked.id.position._value;
					updateArrow(centerPos);
					clearNodePoint();
					clearCenterPoint();
					clearMidPoint();
				}
			}
		}
		// 中间点
		function getMidPoint(p1, p2) {
			let lonLat1 = cartesianToLonlat(p1);
			let lonLat2 = cartesianToLonlat(p2);
			let height = (lonLat1[2] + lonLat2[2]) / 2;
			let point1 = turf.point([lonLat1[0], lonLat1[1]]);
			let point2 = turf.point([lonLat2[0], lonLat2[1]]);
			let midpoint = turf.midpoint(point1, point2);
			let result = midpoint.geometry.coordinates;
			return [result[0], result[1], height];
			// 世界坐标转经纬度坐标
			function cartesianToLonlat(cartesian) {
				let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
				let lon = Cesium.Math.toDegrees(cartographic.longitude);
				let lat = Cesium.Math.toDegrees(cartographic.latitude);
				let height = cartographic.height < 0 ? 0 : cartographic.height;
				return [lon, lat, height];
			}
		}
		// 添加节点
		function createNodePoint() {
			nodePoints.some((item, index) => {
				const node = viewer.entities.add({
					position: item,
					type: "NodeVertex",
					vertexIndex: index, //节点索引
					point: {
						color: Cesium.Color.DARKBLUE.withAlpha(0.4),
						pixelSize: 10,
						outlineColor: Cesium.Color.YELLOW.withAlpha(0.4),
						outlineWidth: 3,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
					},
				});
				nodeEntities.push(node);
			});
		}
		// 添加中点
		function createCenterPoint() {
			let nodeList = [];
			let totalHeight = 0;
			nodePoints.some((item, index) => {
				let lonlat = cartesianToLonlat(item);
				nodeList.push([lonlat[0], lonlat[1]]);
				totalHeight += lonlat[2];
			});
			// 添加中心点
			let height = totalHeight / nodeList.length;
			let features = turf.points(nodeList);
			let center = turf.center(features);
			let point = center.geometry.coordinates;
			const centerPoint = viewer.entities.add({
				position: Cesium.Cartesian3.fromDegrees(point[0], point[1], height),
				type: "CenterVertex",
				vertexIndex: nodeEntities.length, //节点索引
				point: {
					color: Cesium.Color.RED.withAlpha(0.8),
					pixelSize: 10,
					outlineColor: Cesium.Color.BLUE.withAlpha(0.4),
					outlineWidth: 3,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
				},
			});
			centerEntities.push(centerPoint);
			// 计算范围
			let line = turf.lineString(nodeList);
			let bbox = turf.bbox(line);
			let minus = bbox[3] - bbox[1] > bbox[2] - bbox[0] ? bbox[3] - bbox[1] : bbox[2] - bbox[0];
			arrowLength = degreeToMeter(minus * 0.3);
		}
		// 添加中间节点
		function createMidPoint() {
			midPoints = [];
			nodePoints.some((item, index) => {
				if (index < nodePoints.length - 1) {
					let nextItem = nodePoints[index + 1];
					let midPoint = getMidPoint(item, nextItem);
					midPoints.push(Cesium.Cartesian3.fromDegrees(midPoint[0], midPoint[1], midPoint[2]));
					const mid = viewer.entities.add({
						position: Cesium.Cartesian3.fromDegrees(midPoint[0], midPoint[1], midPoint[2]),
						type: "MidVertex",
						vertexIndex: index, //节点索引
						point: {
							color: Cesium.Color.YELLOW.withAlpha(0.4),
							pixelSize: 10,
							outlineColor: Cesium.Color.BLUE.withAlpha(0.4),
							outlineWidth: 3,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
						},
					});
					midEntities.push(mid);
				}
			});
		}
		// 清除节点
		function clearNodePoint() {
			nodeEntities.some((item) => {
				viewer.entities.remove(item);
			});
			nodeEntities = [];
		}
		// 清除中间节点
		function clearMidPoint() {
			midEntities.some((item) => {
				viewer.entities.remove(item);
			});
			midEntities = [];
		}
		// 清除中点
		function clearCenterPoint() {
			centerEntities.some((item) => {
				viewer.entities.remove(item);
			});
			centerEntities = [];
		}
		// 创建坐标轴
		function updateArrow(position, pickedId, length) {
			let activePolyLineMaterial = new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW);
			let AxisLng = viewer.entities.getOrCreateEntity("AxisX");
			AxisLng.type = "Axis";
			AxisLng.polyline = {
				positions: new Cesium.CallbackProperty(function () {
					let lonLat = cartesianToLonlat(position);
					let radiusOffset = meterToDegree(arrowLength);
					let nextPos = Cesium.Cartesian3.fromDegrees(lonLat[0] + radiusOffset, lonLat[1], lonLat[2]);
					return [position, nextPos];
				}, false),
				width: 10,
				material: pickedId === "AxisX" ? activePolyLineMaterial : new Cesium.PolylineArrowMaterialProperty(Cesium.Color.RED),
			};

			let AxisLat = viewer.entities.getOrCreateEntity("AxisY");
			AxisLat.type = "Axis";
			AxisLat.polyline = {
				positions: new Cesium.CallbackProperty(function () {
					let lonLat = cartesianToLonlat(position);
					let radiusOffset = meterToDegree(arrowLength);
					let nextPos = Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1] + radiusOffset, lonLat[2]);
					return [position, nextPos];
				}, false),
				width: 10,
				material: pickedId === "AxisY" ? activePolyLineMaterial : new Cesium.PolylineArrowMaterialProperty(Cesium.Color.GREEN),
			};

			let AxisAlt = viewer.entities.getOrCreateEntity("AxisZ");
			AxisAlt.type = "Axis";
			AxisAlt.polyline = {
				positions: new Cesium.CallbackProperty(function () {
					let lonLat = cartesianToLonlat(position);
					let nextPos = Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], lonLat[2] + arrowLength);
					return [position, nextPos];
				}, false),
				width: 10,
				material: pickedId === "AxisZ" ? activePolyLineMaterial : new Cesium.PolylineArrowMaterialProperty(Cesium.Color.BLUE),
			};
		}
		// 清除坐标轴
		function clearArrow() {
			let AxisX = viewer.entities.getOrCreateEntity("AxisX");
			let AxisY = viewer.entities.getOrCreateEntity("AxisY");
			let AxisZ = viewer.entities.getOrCreateEntity("AxisZ");
			viewer.entities.remove(AxisX);
			viewer.entities.remove(AxisY);
			viewer.entities.remove(AxisZ);
		}
		// 笛卡尔转经纬度
		function cartesianToLonlat(cartesian) {
			let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
			let lon = Cesium.Math.toDegrees(cartographic.longitude);
			let lat = Cesium.Math.toDegrees(cartographic.latitude);
			// let height = cartographic.height < 0 ? 0 : cartographic.height;
			let height = cartographic.height;
			return [lon, lat, height];
		}
		/**
		 * @Author: dongnan
		 * @Description: 米转经纬度(EPSG:4326)
		 * @Date: 2022-01-04 11:10:20
		 * @param {*} meter
		 */
		function meterToDegree(meter) {
			let degree = (meter / (2 * Math.PI * 6371004)) * 360;
			return degree;
		}
		/**
		 * @Author: dongnan
		 * @Description: 经纬度转米(EPSG:4326)
		 * @Date: 2022-01-04 13:54:05
		 * @param {*} degree
		 */
		function degreeToMeter(degree) {
			let meter = (degree / 360) * (2 * Math.PI * 6371004);
			return meter;
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 画面
	 * @Date: 2021-05-31 14:27:51
	 */
	drawPolygon(callback) {
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
			if (!cartesian) return;
			if (positions.length == 0) {
				// 初始存储数据
				positions.push(cartesian);
				positions.push(cartesian.clone());
				// 真实点存储
				polyGonPoints.push(cartesian);
				// 添加点
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: polyGonPoints[polyGonPoints.length - 1],
						point: {
							pixelSize: 10,
							color: Cesium.Color.GREEN,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
							heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
						},
					}),
				);
			} else {
				// 数据更新
				let moveEndPosition = positions[positions.length - 1];
				polyGonPoints.push(moveEndPosition);
				positions = polyGonPoints.concat(moveEndPosition.clone());
				polyGon.positions = positions;
				// 添加点
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: polyGonPoints[polyGonPoints.length - 1],
						point: {
							pixelSize: 10,
							color: Cesium.Color.YELLOW,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
							heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
						},
					}),
				);
			}
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		// 绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
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
					positions.push(cartesian);
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
			this.MeasureEntities.push(
				this.viewer.entities.add({
					position: polyGonPoints[polyGonPoints.length - 1],
					point: {
						pixelSize: 10,
						color: Cesium.Color.RED,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
						heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
					},
				}),
			);
			if (typeof callback == "function") callback(polyGonPoints);
			// 事件销毁
			this.stopDraw();
		}, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画圆
	 * @Date: 2021-06-03 16:37:59
	 */
	drawCircle(callback) {
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
				if (typeof callback == "function") callback(positions[0], circle.radius);
				this.stopDraw();
			}
			clickNum += 1;
		}, Cesium.ScreenSpaceEventType.LEFT_UP);
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
				backgroundPadding: new Cesium.Cartesian2(8, 8),
				backgroundColor: new Cesium.Color(0, 0, 0, 1),
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
		this.color = option.color ?? Cesium.Color.CYAN;
		this.width = option.width ?? 3;
		//实线点位
		this.positions = option.positions;
		//虚线点位
		this.movePositions = option.movePositions;
		//实线实体
		this.polyLine = this.viewer.entities.add({
			name: "实线",
			type: "CustomLine",
			polyline: {
				show: true,
				positions: new Cesium.CallbackProperty(() => {
					return this.positions;
				}, false),
				material: this.color,
				width: this.width,
				// clampToGround: true,
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
					color: this.color,
				}),
				width: this.width,
				clampToGround: true,
			},
		});
		//点实体
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				return this.movePositions[1];
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: this.color,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});

		// this.saveData.push(this.polyLine);
		// this.saveData.push(this.movePolyLine);
		// this.saveData.push(this.movePoint);
	}
	// 清除辅助线
	clear() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
	}
	// 移除所有
	remove() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
		this.viewer.entities.remove(this.polyLine);
	}
}
/**
 * @Author: dongnan
 * @Description: 面Entity
 * @Date: 2021-11-11 21:02:48
 * @param {*} viewer
 * @param {*} positions
 * @param {*} saveData
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
				classificationType: Cesium.ClassificationType.TERRAIN,
				zIndex: 0,
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
						positions = this.positions;
					}
					return positions;
				}, false),
				material: new Cesium.PolylineDashMaterialProperty({
					color: Cesium.Color.BLACK,
				}),
				width: 3,
				clampToGround: true,
				zIndex: 1,
				classificationType: Cesium.ClassificationType.TERRAIN,
			},
		});
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new Cesium.CallbackProperty(() => {
				return this.positions[this.positions.length - 1];
			}, false),
			point: {
				pixelSize: 8,
				color: Cesium.Color.TRANSPARENT,
				outlineColor: Cesium.Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.polyGon);
		this.saveData.push(this.moveLine);
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 21:11:23
	 * @param {*}
	 */
	clear() {
		this.moveLine.polyline.material = new Cesium.PolylineGlowMaterialProperty({
			color: Cesium.Color.CYAN,
			glowPower: 0.25,
			taperPower: 1,
		});
		this.moveLine.polyline.width._value = 5;
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
		this.meters = 0;

		this.circle = this.viewer.entities.add({
			name: "圆",
			position: this.positions[0],
			ellipse: {
				semiMinorAxis: new Cesium.CallbackProperty(() => {
					let meters = getLineDistance(this.positions[0], this.positions[1]);
					if (!meters) meters = 1;
					this.radius = meters;
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
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.circle);
		this.saveData.push(this.movePoint);
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

	return { text: text, cartesian: cartesian, lon: lon, lat: lat };
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
	let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));
	return parseFloat(lengthInMeters);
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
			text = str + " h㎡";
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
