/**
 * @Author: dongnan
 * @Description: 坐标拾取
 * @Date: 2021-10-16 00:36:14
 */
class DrawTool {
	constructor(mapClass, callback) {
		this.mapClass = mapClass;
		this.olMap = mapClass.olMap;
		this.draw = null; //绘制图层
		this.tooltips = []; //标注信息
		this.source = null; // 矢量源
		this.layer = null; //矢量图层
		this.escEvent = null; //esc退出事件
		this.DrawOption = {
			sketch: null,
			helpTooltipElement: null,
			helpTooltip: null,
		}; //配置信息
		this.callback = callback;
		// 初始化图层、提示框、测量框等信息
		this.createVectorLayer();
	}

	/**
	 * @Author: dongnan
	 * @Description: 测距与侧面
	 * @Date: 2021-04-05 20:42:56
	 * @param {*} type LineString Polygon
	 */
	start(type) {
		this.stop();
		this.createHelpTooltip();
		this.draw = new ol.interaction.Draw({
			source: this.source,
			type: type,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: "rgba(255, 255, 255, 0.2)",
				}),
				stroke: new ol.style.Stroke({
					color: "rgba(0, 0, 0, 0.5)",
					lineDash: [10, 10],
					width: 2,
				}),
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: "rgba(0, 0, 0, 0.7)",
					}),
					fill: new ol.style.Fill({
						color: "rgba(255, 255, 255, 0.2)",
					}),
				}),
			}),
		});
		this.olMap.addInteraction(this.draw);
		// 加载移动事件
		this.mapClass.removeEvent("pointermove", "all", "DrawRefresh");
		this.mapClass.addEvent("pointermove", "all", "DrawRefresh", (evt) => {
			if (evt.dragging) {
				return;
			}
			let helpMsg = "单击开始,ESC退出";
			if (this.DrawOption.sketch) {
				let geom = this.DrawOption.sketch.getGeometry();
				if (geom instanceof ol.geom.Polygon) {
					helpMsg = "单击继续画面<br>双击结束,ESC退出";
				} else if (geom instanceof ol.geom.LineString) {
					helpMsg = "单击继续画线<br>双击结束,ESC退出";
				} else if (geom instanceof ol.geom.Point) {
					helpMsg = "单击继续画点<br>ESC退出";
				}
			}
			this.DrawOption.helpTooltipElement.innerHTML = helpMsg;
			this.DrawOption.helpTooltip.setPosition(evt.coordinate);
			this.DrawOption.helpTooltipElement.classList.remove("hidden");
		});
		// 开始绘制
		this.draw.on("drawstart", (evt) => {
			// 存储绘制的要素
			this.DrawOption.sketch = evt.feature;
		});
		// 绘制结束
		this.draw.on("drawend", (evt) => {
			this.stopDraw();
			let feature = new ol.format.GeoJSON().writeFeature(evt.feature);
			if (typeof this.callback == "function") this.callback(feature);
		});
		// 绑定退出事件
		this.escEvent = (evt) => {
			if (evt.keyCode == "27") {
				document.removeEventListener("keydown", this.escEvent);
				this.stop();
			}
		};
		document.addEventListener("keydown", this.escEvent);
		/**
		 * Format length output.
		 * @param {module:ol/geom/LineString~LineString} line The line.
		 * @return {string} The formatted length.
		 */
		function formatLength(line) {
			let length = ol.sphere.getLength(line, {
				projection: "EPSG:4326",
				radius: 6371008.8,
			});
			let output;
			if (length > 100) {
				output = Math.round((length / 1000) * 100) / 100 + " " + "km";
			} else {
				output = Math.round(length * 100) / 100 + " " + "m";
			}
			return output;
		}
		/**
		 * Format area output.
		 * @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
		 * @return {string} Formatted area.
		 */
		function formatArea(polygon) {
			let area = ol.sphere.getArea(polygon, {
				projection: "EPSG:4326",
				radius: 6371008.8,
			});
			let output;
			if (area > 10000) {
				output = Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
			} else {
				output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
			}
			return output;
		}
	}
	stopDraw() {
		// 移除事件
		this.mapClass.removeEvent("pointermove", "all", "DrawRefresh");
		// 去除overlay
		this.tooltips.some((item) => {
			this.olMap.removeOverlay(item);
		});
		this.tooltips = [];
		// 停止画
		if (this.draw) {
			this.olMap.removeInteraction(this.draw);
			this.draw = null;
		}
		// 重置参数
		this.DrawOption = {
			sketch: null,
			helpTooltipElement: null,
			helpTooltip: null,
		};
		if (this.escEvent) {
			document.removeEventListener("keydown", this.escEvent);
			this.escEvent = null;
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 停止画
	 * @Date: 2021-04-05 22:29:26
	 */
	stop() {
		if (typeof this.callback == "function") this.callback(null);
		this.stopDraw();
		// 清除要素
		if (this.source) {
			this.source.clear();
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 初始化图层
	 * @Date: 2021-10-16 18:16:48
	 */
	createVectorLayer() {
		this.source = new ol.source.Vector();
		this.layer = new ol.layer.Vector({
			source: this.source,
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: "rgba(255, 255, 255, 0.2)",
				}),
				stroke: new ol.style.Stroke({
					color: "#FF8C00",
					width: 2,
				}),
				image: new ol.style.Icon({
					anchor: [0.5, 1],
					scale: 1.5,
					size: [32, 32],
					src: "/img/OnlineMap/position.svg",
				}),
			}),
			zIndex: 999,
			displayInLayerSwitcher: false,
		});
		this.olMap.addLayer(this.layer);
	}
	/**
	 * @Author: dongnan
	 * @Description: 新建帮助提示
	 * @Date: 2021-04-05 23:46:42
	 */
	createHelpTooltip() {
		if (this.DrawOption.helpTooltipElement) {
			this.DrawOption.helpTooltipElement.parentNode.removeChild(this.DrawOption.helpTooltipElement);
		}
		this.DrawOption.helpTooltipElement = document.createElement("div");
		this.DrawOption.helpTooltipElement.className = "tooltip";
		this.DrawOption.helpTooltip = new ol.Overlay({
			element: this.DrawOption.helpTooltipElement,
			offset: [15, 0],
			positioning: "center-left",
		});
		this.tooltips.push(this.DrawOption.helpTooltip);
		this.olMap.addOverlay(this.DrawOption.helpTooltip);
	}
}
export default DrawTool;
