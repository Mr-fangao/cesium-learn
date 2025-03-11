/**
 * @Author: dongnan
 * @Description: 量测工具
 * @Date: 2021-10-16 00:36:14
 */
class MeasureTool {
	constructor(mapClass) {
		this.mapClass = mapClass;
		this.olMap = mapClass.olMap;
		this.draw = null; //绘制图层
		this.listener = null; //监听事件
		this.tooltips = []; //标注信息
		this.source = null; // 矢量源
		this.layer = null; //矢量图层
		this.escEvent = null; //esc退出事件
		this.MeasureOption = {
			sketch: null,
			helpTooltipElement: null,
			helpTooltip: null,
			measureTooltipElement: null,
			measureTooltip: null,
		}; //配置信息
	}

	/**
	 * @Author: dongnan
	 * @Description: 测距与侧面
	 * @Date: 2021-04-05 20:42:56
	 * @param {*} type LineString Polygon
	 */
	start(type) {
		this.stop();
		// 初始化图层、提示框、测量框等信息
		this.createVectorLayer();
		this.createMeasureTooltip();
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
		this.mapClass.removeEvent("pointermove", "all", "MeasureRefresh");
		this.mapClass.addEvent("pointermove", "all", "MeasureRefresh", (evt) => {
			if (evt.dragging) {
				return;
			}
			let helpMsg = "单击开始,ESC退出";
			if (this.MeasureOption.sketch) {
				let geom = this.MeasureOption.sketch.getGeometry();
				if (geom instanceof ol.geom.Polygon) {
					helpMsg = "单击继续画面<br>双击结束,ESC退出";
				} else if (geom instanceof ol.geom.LineString) {
					helpMsg = "单击继续画线<br>双击结束,ESC退出";
				}
			}
			this.MeasureOption.helpTooltipElement.innerHTML = helpMsg;
			this.MeasureOption.helpTooltip.setPosition(evt.coordinate);
			this.MeasureOption.helpTooltipElement.classList.remove("hidden");
		});
		// 开始绘制
		this.draw.on("drawstart", (evt) => {
			// 存储绘制的要素
			this.MeasureOption.sketch = evt.feature;
			let tooltipCoord = evt.coordinate;
			this.listener = this.MeasureOption.sketch.getGeometry().on("change", (evt) => {
				let geom = evt.target;
				let output;
				if (geom instanceof ol.geom.Polygon) {
					output = formatArea(geom);
					tooltipCoord = geom.getInteriorPoint().getCoordinates();
				} else if (geom instanceof ol.geom.LineString) {
					output = formatLength(geom);
					tooltipCoord = geom.getLastCoordinate();
				}
				this.MeasureOption.measureTooltipElement.innerHTML = output;
				this.MeasureOption.measureTooltip.setPosition(tooltipCoord);
			});
		});
		// 绘制结束
		this.draw.on("drawend", () => {
			this.MeasureOption.measureTooltipElement.className = "tooltip tooltip-static";
			this.MeasureOption.measureTooltip.setOffset([0, -7]);
			this.MeasureOption.sketch = null;
			this.MeasureOption.measureTooltipElement = null;
			ol.Observable.unByKey(this.listener);
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
	/**
	 * @Author: dongnan
	 * @Description: 停止画
	 * @Date: 2021-04-05 22:29:26
	 */
	stop() {
		// 移除事件
		this.mapClass.removeEvent("pointermove", "all", "MeasureRefresh");
		// 移除监听事件
		if (this.listener) {
			ol.Observable.unByKey(this.listener);
		}
		// 清除要素
		if (this.source) {
			this.source.clear();
			this.olMap.removeLayer(this.layer);
		}
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
		this.MeasureOption = {
			sketch: null,
			helpTooltipElement: null,
			helpTooltip: null,
			measureTooltipElement: null,
			measureTooltip: null,
		};
		if (this.escEvent) {
			this.escEvent = null;
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
					color: "#FF4500",
					width: 2,
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
		if (this.MeasureOption.helpTooltipElement) {
			this.MeasureOption.helpTooltipElement.parentNode.removeChild(this.MeasureOption.helpTooltipElement);
		}
		this.MeasureOption.helpTooltipElement = document.createElement("div");
		this.MeasureOption.helpTooltipElement.className = "tooltip";
		this.MeasureOption.helpTooltip = new ol.Overlay({
			element: this.MeasureOption.helpTooltipElement,
			offset: [15, 0],
			positioning: "center-left",
		});
		this.tooltips.push(this.MeasureOption.helpTooltip);
		this.olMap.addOverlay(this.MeasureOption.helpTooltip);
	}
	/**
	 * @Author: dongnan
	 * @Description: 新建量测提示
	 * @Date: 2021-04-05 23:46:28
	 */
	createMeasureTooltip() {
		if (this.MeasureOption.measureTooltipElement) {
			this.MeasureOption.measureTooltipElement.parentNode.removeChild(this.MeasureOption.measureTooltipElement);
		}
		this.MeasureOption.measureTooltipElement = document.createElement("div");
		this.MeasureOption.measureTooltipElement.className = "tooltip tooltip-measure";
		this.MeasureOption.measureTooltip = new ol.Overlay({
			element: this.MeasureOption.measureTooltipElement,
			offset: [0, -15],
			positioning: "bottom-center",
		});
		this.tooltips.push(this.MeasureOption.measureTooltip);
		this.olMap.addOverlay(this.MeasureOption.measureTooltip);
	}
}
export default MeasureTool;
