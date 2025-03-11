import useOnlineStore from "@/store/online";
const onlineStore = useOnlineStore();
class SplitTool {
	constructor(mapClass) {
		this.mapClass = mapClass;
		this.olMap = this.mapClass.olMap;
		this.init();
	}
	init() {
		let parent = this.mapClass.div.parentNode;
		let mask = document.createElement("div");
		let dom1 = document.createElement("div");
		let dom2 = document.createElement("div");
		let closeDom = document.createElement("div");
		let splitLine = document.createElement("div");
		splitLine.id = "SplitLine";
		splitLine.style.display = "none";
		splitLine.style.position = "absolute";
		splitLine.style.width = "3px";
		splitLine.style.height = "100%";
		splitLine.style.left = "calc((100% - 3px)/2)";
		splitLine.style.top = "0px";
		splitLine.style.zIndex = 100;
		splitLine.style.background = "#00BFFF";
		closeDom.id = "SplitClose";
		closeDom.style.position = "absolute";
		closeDom.style.right = "10px";
		closeDom.style.top = "10px";
		closeDom.style.background = "#000";
		closeDom.style.zIndex = 100;
		closeDom.innerText = "×";
		closeDom.style.fontSize = "20px";
		closeDom.style.color = "#fff";
		closeDom.style.display = "none";
		closeDom.style.width = "30px";
		closeDom.style.height = "30px";
		closeDom.style.textAlign = "center";
		closeDom.style.lineHeight = "30px";
		closeDom.style.cursor = "pointer";
		closeDom.style.borderRadius = "5px";
		mask.id = "SplitMask";
		mask.style.background = "#fff";
		mask.style.position = "absolute";
		mask.style.left = "0px";
		mask.style.top = "0px";
		mask.style.zIndex = 98;
		mask.style.width = "100%";
		mask.style.height = "100%";
		mask.style.display = "none";
		dom1.id = "SpiltLeft";
		dom1.style.display = "none";
		dom1.style.width = "50%";
		dom1.style.height = "100%";
		dom1.style.position = "absolute";
		dom1.style.top = "0px";
		dom1.style.left = "0px";
		dom1.style.zIndex = 99;
		dom2.id = "SpiltRight";
		dom2.style.display = "none";
		dom2.style.width = "50%";
		dom2.style.height = "100%";
		dom2.style.position = "absolute";
		dom2.style.top = "0px";
		dom2.style.right = "0px";
		dom2.style.zIndex = 99;
		let self = this;
		closeDom.onclick = function () {
			self.stop();
		};
		parent.appendChild(dom1);
		parent.appendChild(dom2);
		parent.appendChild(mask);
		parent.appendChild(closeDom);
		parent.appendChild(splitLine);
	}
	// 启动
	start() {
		this.mapClass.div.style.display = "none";
		let dom1 = document.getElementById("SpiltLeft");
		let dom2 = document.getElementById("SpiltRight");
		let mask = document.getElementById("SplitMask");
		let closeDom = document.getElementById("SplitClose");
		let splitLine = document.getElementById("SplitLine");
		dom1.style.display = "block";
		dom2.style.display = "block";
		mask.style.display = "block";
		closeDom.style.display = "block";
		splitLine.style.display = "block";
		let center = this.olMap.getView().getCenter();
		let zoom = this.olMap.getView().getZoom();
		this.view = new ol.View({
			projection: ol.proj.get("EPSG:4326"),
			center: center,
			zoom: zoom,
			// minZoom: 9,
			maxZoom: 18,
		});
		this.splitLeft = new ol.Map({
			target: dom1,
			layers: [
				new ol.layer.Vector({
					source: new ol.source.Vector({
						url: "/data/nanjing.json",
						format: new ol.format.GeoJSON(),
						projection: "EPSG:4326",
					}),
					style: function (feature) {
						let style;
						if (feature.A.name == onlineStore.AreaName) {
							style = new ol.style.Style({
								fill: new ol.style.Fill({
									color: "rgba(176,224,230,0.1)",
								}),
								stroke: new ol.style.Stroke({
									color: "rgba(0,206,209,1)",
									width: 2,
									lineDash: [5, 5], // 设置虚线样式
								}),
							});
						} else {
							style = new ol.style.Style({
								fill: new ol.style.Fill({
									color: "transparent",
								}),
							});
						}

						return style;
					},
					zIndex: 30,
					minResolution: 0,
					maxResolution: 1,
				}),
				this.mapClass.loadBase({
					type: "tianditu",
					kind: "vectorLabel",
					zIndex: 2,
				}),
				this.mapClass.loadBase({
					type: "tianditu",
					kind: "vectorTile",
					zIndex: 1,
				}),
			],
			view: this.view,
			controls: [],
		});
		this.splitRight = new ol.Map({
			target: dom2,
			layers: [
				new ol.layer.Vector({
					source: new ol.source.Vector({
						url: "/data/nanjing.json",
						format: new ol.format.GeoJSON(),
						projection: "EPSG:4326",
					}),
					style: function (feature) {
						let style;
						if (feature.A.name == onlineStore.AreaName) {
							style = new ol.style.Style({
								fill: new ol.style.Fill({
									color: "rgba(176,224,230,0.1)",
								}),
								stroke: new ol.style.Stroke({
									color: "rgba(0,206,209,1)",
									width: 2,
									lineDash: [5, 5], // 设置虚线样式
								}),
							});
						} else {
							style = new ol.style.Style({
								fill: new ol.style.Fill({
									color: "transparent",
								}),
							});
						}

						return style;
					},
					zIndex: 30,
					minResolution: 0,
					maxResolution: 1,
				}),
				this.mapClass.loadBase({
					type: "tianditu",
					kind: "imageLabel",
					zIndex: 2,
				}),
				this.mapClass.loadBase({
					type: "tianditu",
					kind: "imageTile",
					zIndex: 1,
				}),
			],
			view: this.view,
			controls: [],
		});
		this.splitLeft.addInteraction(new ol.interaction.Synchronize({ maps: [this.splitRight] }));
		this.splitRight.addInteraction(new ol.interaction.Synchronize({ maps: [this.splitLeft] }));
	}
	// 取消
	stop() {
		this.mapClass.div.style.display = "block";
		let dom1 = document.getElementById("SpiltLeft");
		let dom2 = document.getElementById("SpiltRight");
		let mask = document.getElementById("SplitMask");
		let closeDom = document.getElementById("SplitClose");
		let splitLine = document.getElementById("SplitLine");
		dom1.innerHTML = "";
		dom2.innerHTML = "";
		dom1.style.display = "none";
		dom2.style.display = "none";
		mask.style.display = "none";
		closeDom.style.display = "none";
		splitLine.style.display = "none";
	}
}
export default SplitTool;
