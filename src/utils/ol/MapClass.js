import proj4 from "proj4";
import { initBaiduProj } from "./BaiDuProj";
import { lineString as turfLineString, bbox as turfBBox } from "@turf/turf";
/**
 * @Author: dongnan
 * @Description: ol 图层、事件、冒泡框存储管理
 * @Date: 2021-10-13 10:07:01
 */
class MapClass {
	constructor(option) {
		// 列表新增
		Array.prototype.pushHead = function () {
			for (let i = 0; i < arguments.length; i++) {
				this.splice(i, 0, arguments[i]);
			}
		};
		Array.prototype.popHead = function (count) {
			if (typeof count === "undefined") {
				this.splice(0, 1);
			}
			if (typeof count === "number") {
				this.splice(0, count);
			}
		};
		this.defineGCJ02();
		this.registerProjs(option.projList);
		this.debugView = option.debugView; //是否调试
		this.layers = []; //存储所创建的图层
		this.events = []; //存储事件
		this.popups = []; //冒泡框
		this.view = option.view; //初始化view
		this.controls = option.controls || ol.control.defaults();
		this.div = typeof option.target == "string" ? document.getElementById(option.target) : option.target; //渲染的容器
		this.olMap = new ol.Map({
			view: this.view,
			target: this.div,
			controls: this.controls,
		}); //初始化map
		this.baseLayers = this.initBaseLayer(option.baseLayers); //存储所有基础底图(不加底图的都是憨批,不做空值判断)
		this.baseOptions = option.baseOptions; //基础底图切换参数
		this.bindMapEvents(); //初始化地图点击事件
		this.baseId = option.baseId || 1; //当前底图id
		// 加载基础底图
		if (Array.isArray(this.baseOptions) && this.baseOptions.length > 0) {
			this.switchBase(this.baseId);
		} else {
			this.switchBase("all");
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 定义 GCJ-02 坐标系 code:"GCJ-02"
	 * @Date: 2021-11-22 16:11:25
	 */
	defineGCJ02() {
		let forEachPoint = function (func) {
			return function (input, opt_output, opt_dimension) {
				let len = input.length;
				let dimension = opt_dimension ? opt_dimension : 2;
				let output;
				if (opt_output) {
					output = opt_output;
				} else {
					if (dimension !== 2) {
						output = input.slice();
					} else {
						output = new Array(len);
					}
				}
				for (let offset = 0; offset < len; offset += dimension) {
					func(input, output, offset);
				}
				return output;
			};
		};
		let gcj02 = {};
		let PI = Math.PI;
		let AXIS = 6378245.0;
		let OFFSET = 0.00669342162296594323; // (a^2 - b^2) / a^2
		function delta(wgLon, wgLat) {
			let dLat = transformLat(wgLon - 105.0, wgLat - 35.0);
			let dLon = transformLon(wgLon - 105.0, wgLat - 35.0);
			let radLat = (wgLat / 180.0) * PI;
			let magic = Math.sin(radLat);
			magic = 1 - OFFSET * magic * magic;
			let sqrtMagic = Math.sqrt(magic);
			dLat = (dLat * 180.0) / (((AXIS * (1 - OFFSET)) / (magic * sqrtMagic)) * PI);
			dLon = (dLon * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radLat) * PI);
			return [dLon, dLat];
		}
		function outOfChina(lon, lat) {
			if (lon < 72.004 || lon > 137.8347) {
				return true;
			}
			if (lat < 0.8293 || lat > 55.8271) {
				return true;
			}
			return false;
		}
		function transformLat(x, y) {
			let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
			ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
			ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
			ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
			return ret;
		}
		function transformLon(x, y) {
			let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
			ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
			ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
			ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
			return ret;
		}
		gcj02.toWGS84 = forEachPoint(function (input, output, offset) {
			let lng = input[offset];
			let lat = input[offset + 1];
			if (!outOfChina(lng, lat)) {
				let deltaD = delta(lng, lat);
				lng = lng - deltaD[0];
				lat = lat - deltaD[1];
			}
			output[offset] = lng;
			output[offset + 1] = lat;
		});

		gcj02.fromWGS84 = forEachPoint(function (input, output, offset) {
			let lng = input[offset];
			let lat = input[offset + 1];
			if (!outOfChina(lng, lat)) {
				let deltaD = delta(lng, lat);
				lng = lng + deltaD[0];
				lat = lat + deltaD[1];
			}
			output[offset] = lng;
			output[offset + 1] = lat;
		});
		let sphericalMercator = {};
		let RADIUS = 6378137;
		let MAX_LATITUDE = 85.0511287798;
		let RAD_PER_DEG = Math.PI / 180;
		sphericalMercator.forward = forEachPoint(function (input, output, offset) {
			let lat = Math.max(Math.min(MAX_LATITUDE, input[offset + 1]), -MAX_LATITUDE);
			let sin = Math.sin(lat * RAD_PER_DEG);

			output[offset] = RADIUS * input[offset] * RAD_PER_DEG;
			output[offset + 1] = (RADIUS * Math.log((1 + sin) / (1 - sin))) / 2;
		});
		sphericalMercator.inverse = forEachPoint(function (input, output, offset) {
			output[offset] = input[offset] / RADIUS / RAD_PER_DEG;
			output[offset + 1] = (2 * Math.atan(Math.exp(input[offset + 1] / RADIUS)) - Math.PI / 2) / RAD_PER_DEG;
		});
		let projzh = {};
		projzh.ll2gmerc = function (input, opt_output, opt_dimension) {
			let output = gcj02.fromWGS84(input, opt_output, opt_dimension);
			return projzh.ll2smerc(output, output, opt_dimension);
		};
		projzh.gmerc2ll = function (input, opt_output, opt_dimension) {
			let output = projzh.smerc2ll(input, input, opt_dimension);
			return gcj02.toWGS84(output, opt_output, opt_dimension);
		};
		projzh.smerc2gmerc = function (input, opt_output, opt_dimension) {
			let output = projzh.smerc2ll(input, input, opt_dimension);
			output = gcj02.fromWGS84(output, output, opt_dimension);
			return projzh.ll2smerc(output, output, opt_dimension);
		};
		projzh.gmerc2smerc = function (input, opt_output, opt_dimension) {
			let output = projzh.smerc2ll(input, input, opt_dimension);
			output = gcj02.toWGS84(output, output, opt_dimension);
			return projzh.ll2smerc(output, output, opt_dimension);
		};
		projzh.ll2smerc = sphericalMercator.forward;
		projzh.smerc2ll = sphericalMercator.inverse;
		const gcj02Extent = [-20037508.342789244, -20037508.342789244, 20037508.342789244, 20037508.342789244];
		const gcjMecator = new ol.proj.Projection({
			code: "GCJ-02",
			extent: gcj02Extent,
			units: "m",
		});
		ol.proj.addProjection(gcjMecator);
		ol.proj.addCoordinateTransforms("EPSG:4326", gcjMecator, projzh.ll2gmerc, projzh.gmerc2ll);
		ol.proj.addCoordinateTransforms("EPSG:3857", gcjMecator, projzh.smerc2gmerc, projzh.gmerc2smerc);
	}
	/**
	 * @Author: dongnan
	 * @Description: 定义坐标系
	 * @Date: 2021-10-12 16:17:10
	 * @param {*} list
	 */
	registerProjs(list) {
		if (Array.isArray(list) && list.length > 0) {
			for (let item of list) {
				proj4.defs(item.name, item.projection);
			}
			ol.proj.proj4.register(proj4);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 初始化view
	 * @Date: 2021-03-19 17:36:23
	 */
	initView(viewOption) {
		if (!viewOption.projection) {
			viewOption.projection = ol.proj.get("EPSG:4326");
		}
		return new ol.View(viewOption);
	}
	/**
	 * @Author: dongnan
	 * @Description: 绑定地图事件
	 * @Date: 2021-03-21 20:52:07
	 */
	bindMapEvents() {
		// 禁用鼠标双击缩放事件
		const dblClickInteraction = this.olMap
			.getInteractions()
			.getArray()
			.find((interaction) => {
				return interaction instanceof ol.interaction.DoubleClickZoom;
			});
		this.olMap.removeInteraction(dblClickInteraction);

		// 鼠标单击事件
		this.olMap.on("singleclick", (evt) => {
			console.log("当前点击的坐标为:" + evt.coordinate);
			if (this.debugView) {
				console.log(
					"当前页面中心点位:" +
						this.olMap.getView().getCenter() +
						"  当前页面层级:" +
						this.olMap.getView().getZoom() +
						"  当前页面限制范围:" +
						this.getExtent(),
				);
			}
			this.events.some((eventObj) => {
				if (eventObj.type == "singleclick") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureClick") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 鼠标移动事件
		this.olMap.on("pointermove", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "pointermove") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureMove") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					} else if (eventObj.kind == "featureHover") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (eventObj.feature != feature) {
							if (feature && typeof eventObj.listener == "function") {
								eventObj.listener(feature, this, evt);
							}
							eventObj.feature = feature;
						}
					} else if (eventObj.kind == "featureOut") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (eventObj.feature != feature) {
							if (eventObj.feature && typeof eventObj.listener == "function") {
								eventObj.listener(eventObj.feature, this, evt);
							}
							eventObj.feature = feature;
						}
					}
				}
			});
		});
		// 地图点击事件
		this.olMap.on("click", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "click") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureClick") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 地图移动事件
		this.olMap.on("movestart", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "movestart") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureMovestart") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 地图移动事件
		this.olMap.on("moveend", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "moveend") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureMoveend") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 鼠标双击事件
		this.olMap.on("dblclick", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "dblclick") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureDoubleClick") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 鼠标右击事件
		this.olMap.on("contextmenu", (evt) => {
			// 阻止默认浏览器事件
			evt.originalEvent.preventDefault();
			this.events.some((eventObj) => {
				if (eventObj.type == "contextmenu") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureClick") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
		// 鼠标拖拽事件
		this.olMap.on("pointerdrag", (evt) => {
			this.events.some((eventObj) => {
				if (eventObj.type == "pointerdrag") {
					if (eventObj.kind == "all") {
						if (eventObj.layer && typeof eventObj.listener == "function") {
							eventObj.listener(evt, this);
						}
					} else if (eventObj.kind == "featureDrag") {
						let feature = this.olMap.forEachFeatureAtPixel(
							evt.pixel,
							function (feature) {
								return feature;
							},
							{
								layerFilter: function (layer) {
									return layer == eventObj.layer;
								},
							},
						);
						if (feature && typeof eventObj.listener == "function") {
							eventObj.listener(feature, this, evt);
						}
					}
				}
			});
		});
	}
	// 获取圆半径 米
	getCircleRadius(radius) {
		let metersPerUnit = this.view.getProjection().getMetersPerUnit();
		let circleRadius = radius / metersPerUnit;
		return circleRadius;
	}
	/**
	 * @Author: dongnan
	 * @Description: 初始化基础图层
	 * @Date: 2021-03-23 21:21:05
	 */
	initBaseLayer(baseLayers) {
		let layerList = [];
		for (let base of baseLayers) {
			base.displayInLayerSwitcher = true;
			base.allwaysOnTop = true;
			base.noSwitcherDelete = true;
			let layer = this.loadBase(base);
			if (layer) {
				layerList.push(layer);
			}
		}
		return layerList;
	}
	/**
	 * @Author: dongnan
	 * @Description: 加载基础底图
	 * @Date: 2021-03-24 21:02:25
	 * @param {*} option 配置参数 {type:"tianditu",kind:"image",showLevel:[0,18],zIndex}
	 */
	loadBase(base) {
		let self = this;
		switch (base.type) {
			case "tianditu":
				return loadTDT(base);
			case "arcgis":
				return loadArcGis(base);
			case "google":
				return loadGoogle(base);
			case "gaode":
				return loadGaoDe(base);
			case "baidu":
				return loadBaiDu(base);
			case "tengxun":
				return loadTengXun(base);
			case "osm": {
				let resolutions = self.transformResolution(base.showLevel);
				var layer = new ol.layer.Tile({
					source: new ol.source.OSM(),
					minResolution: resolutions[0],
					maxResolution: resolutions[1],
				});
				return layer;
			}
			case "wmts":
				return loadWMTS(base);
			case "mvt":
				return loadMVT(base);
			case "webTile":
				return loadWebTile(base);
			default:
				return false;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载天地图
		 * @Date: 2021-10-13 17:14:17
		 * @param {*} base
		 */
		function loadTDT(base) {
			let resolutions = self.transformResolution(base.showLevel);
			let urls = [];
			let title = "";
			if (base.kind == "imageTile") {
				urls = [
					"http://t0.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t1.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t2.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t3.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t4.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t5.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t6.tianditu.com/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
				];
				title = "天地图影像瓦片";
			} else if (base.kind == "imageLabel") {
				urls = [
					"http://t0.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t1.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t2.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t3.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t4.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t5.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t6.tianditu.com/DataServer?T=cia_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
				];
				title = "天地图影像瓦片标注";
			} else if (base.kind == "vectorTile") {
				urls = [
					"http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t1.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t2.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t3.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t4.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t5.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t6.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
				];
				title = "天地图矢量瓦片";
			} else if (base.kind == "vectorLabel") {
				urls = [
					"http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t1.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t2.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t3.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t4.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t5.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
					"http://t6.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=aef1277d283beb91a608f2971d735fb2",
				];
				title = "天地图矢量瓦片标注";
			}
			let layer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					urls: urls,
				}),
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
				title: title,
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载arcgis服务
		 * @Date: 2021-10-13 17:31:23
		 * @param {*} base
		 */
		function loadArcGis(base) {
			let url = "";
			let tile_origin = [-2.0037508342787e7, 2.0037508342787e7];
			let tile_matrixIds = [];
			let tile_resolutions = [];
			let fullExtent = [];
			let tileLayer = "";
			let title = "";
			if (base.kind == "imageTile") {
				url = "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
				tile_matrixIds = [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"10",
					"11",
					"12",
					"13",
					"14",
					"15",
					"16",
					"17",
					"18",
					"19",
					"20",
					"21",
					"22",
					"23",
				];
				tile_resolutions = [
					156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998,
					2445.98490512499, 1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324,
					38.21851414253662, 19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503,
					0.5971642835598172, 0.29858214164761665, 0.14929107082380833, 0.07464553541190416, 0.03732276770595208,
					0.01866138385297604,
				];
				fullExtent = [-2.003750722959434e7, -1.997186888040859e7, 2.003750722959434e7, 1.9971868880408563e7];
				tileLayer = "World_Imagery";
				title = "ArcGIS影像瓦片";
			} else if (base.kind == "vector") {
				url = "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}";
				tile_matrixIds = [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"10",
					"11",
					"12",
					"13",
					"14",
					"15",
					"16",
					"17",
					"18",
					"19",
				];
				tile_resolutions = [
					156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998,
					2445.98490512499, 1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324,
					38.21851414253662, 19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503,
					0.5971642835598172, 0.29858214164761665,
				];
				fullExtent = [-2.0037507067161843e7, -1.819812769412998e7, 2.0037507067161843e7, 2.8686510967305996e7];
				tileLayer = "ChinaOnlineCommunity";
				tileLayer = "World_Street_Map";
				title = "ArcGIS矢量瓦片";
			} else if (base.kind == "blue") {
				url = "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}";
				tile_matrixIds = [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"10",
					"11",
					"12",
					"13",
					"14",
					"15",
					"16",
					"17",
					"18",
					"19",
				];
				tile_resolutions = [
					156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998,
					2445.98490512499, 1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324,
					38.21851414253662, 19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503,
					0.5971642835598172, 0.29858214164761665,
				];
				fullExtent = [-2.0037507067161843e7, -1.819812769412998e7, 2.0037507067161843e7, 2.8686510967305996e7];
				tileLayer = "ChinaOnlineStreetPurplishBlue";
				title = "ArcGIS蓝黑瓦片";
			} else if (base.kind == "grey") {
				url = "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}";
				tile_matrixIds = [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"10",
					"11",
					"12",
					"13",
					"14",
					"15",
					"16",
					"17",
					"18",
					"19",
				];
				tile_resolutions = [
					156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998,
					2445.98490512499, 1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324,
					38.21851414253662, 19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503,
					0.5971642835598172, 0.29858214164761665,
				];
				fullExtent = [-5.494660490872797e7, -1.796331314323799e7, 5.400734670515995e7, 2.892132551819798e7];
				tileLayer = "ChinaOnlineStreetGray";
				title = "ArcGIS灰度瓦片";
			} else if (base.kind == "warm") {
				url = "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}";
				tile_matrixIds = [
					"0",
					"1",
					"2",
					"3",
					"4",
					"5",
					"6",
					"7",
					"8",
					"9",
					"10",
					"11",
					"12",
					"13",
					"14",
					"15",
					"16",
					"17",
					"18",
					"19",
				];
				tile_resolutions = [
					156543.03392800014, 78271.51696399994, 39135.75848200009, 19567.87924099992, 9783.93962049996, 4891.96981024998,
					2445.98490512499, 1222.992452562495, 611.4962262813797, 305.74811314055756, 152.87405657041106, 76.43702828507324,
					38.21851414253662, 19.10925707126831, 9.554628535634155, 4.77731426794937, 2.388657133974685, 1.1943285668550503,
					0.5971642835598172, 0.29858214164761665,
				];
				fullExtent = [-5.494660490872797e7, -1.796331314323799e7, 5.400734670515995e7, 2.892132551819798e7];
				tileLayer = "ChinaOnlineStreetWarm";
				title = "ArcGIS暖色瓦片";
			}
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: url,
					layer: tileLayer,
					matrixSet: "default028mm",
					projection: ol.proj.get("GCJ-02"),
					format: "image/png",
					tileGrid: new ol.tilegrid.WMTS({
						tileSize: 256,
						extent: fullExtent,
						origin: tile_origin,
						resolutions: tile_resolutions,
						matrixIds: tile_matrixIds,
					}),
					style: "default",
					wrapX: true,
					crossOrigin: "anonymous",
					maxZoom: 24,
				}),
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
				title: title,
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载谷歌服务
		 * @Date: 2021-10-13 17:34:40
		 * @param {*} base
		 */
		function loadGoogle(base) {
			let url = "";
			if (base.kind == "imageTile") {
				url = "http://mt3.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}";
			} else if (base.kind == "imageLabel") {
				url = "http://mt3.google.cn/maps/vt?lyrs=h@189&gl=cn&x={x}&y={y}&z={z}";
			} else if (base.kind == "vector") {
				url = "http://mt3.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}";
			} else if (base.kind == "street") {
				url =
					"http://mt3.google.cn/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i380072576!3m8!2szh-CN!3scn!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0";
			} else if (base.kind == "ground") {
				url = "http://mt3.google.cn/maps/vt?lyrs=t@189&gl=cn&x={x}&y={y}&z={z}";
			}
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: url,
					projection: ol.proj.get("GCJ-02"),
					crossOrigin: "anonymous",
				}),
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载高德服务
		 * @Date: 2021-10-17 21:19:17
		 * @param {*} base
		 */
		function loadGaoDe(base) {
			let url = "";
			if (base.kind == "imageTile") {
				url = "http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
			} else if (base.kind == "imageLabel") {
				url = "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8";
			} else if (base.kind == "vector") {
				url = "http://webst02.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}";
			} else if (base.kind == "street") {
				url = "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";
			}
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					projection: ol.proj.get("GCJ-02"),
					url: url,
					crossOrigin: "anonymous",
					maxZoom: 20,
				}),
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载腾讯地图
		 * @Date: 2021-11-22 17:39:45
		 * @param {*}
		 */
		function loadTengXun(base) {
			let source;
			if (base.kind == "vector") {
				source = new ol.source.XYZ({
					projection: ol.proj.get("GCJ-02"),
					tileUrlFunction(xyz) {
						const z = xyz[0];
						const x = xyz[1];
						const y = xyz[2];
						const newY = parseInt(String(2 ** z), 10) - y - 1; // 此处极其重要
						return `https://rt1.map.gtimg.com/realtimerender?z=${z}&x=${x}&y=${newY}&key=4OSBZ-EUGKP-FVODF-LZHGI-UPEIV-LHF5Q`;
					},
					maxZoom: 18,
					wrapX: false,
				});
			} else if (base.kind == "imageTile") {
				source = new ol.source.XYZ({
					projection: ol.proj.get("GCJ-02"),
					tileUrlFunction(xyz) {
						const z = xyz[0];
						const x = xyz[1];
						const y = xyz[2];
						const newY = parseInt(String(2 ** z), 10) - y - 1; // 此处极其重要
						return `https://p3.map.gtimg.com/sateTiles?z=${z}&x=${x}&y=${newY}&key=4OSBZ-EUGKP-FVODF-LZHGI-UPEIV-LHF5Q`;
					},
					maxZoom: 18,
					wrapX: false,
				});
			}
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: source,
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载百度服务
		 * @Date: 2021-10-17 21:16:34
		 * @param {*} base
		 */
		function loadBaiDu(base) {
			// 添加百度坐标系
			initBaiduProj();
			let source = null;
			if (base.kind == "vector") {
				let tileResolutions = new Array(19);
				for (let i = 0; i < 19; i++) {
					tileResolutions[i] = Math.pow(2, 18 - i);
				}
				source = new ol.source.TileImage({
					projection: ol.proj.get("baidu"),
					tileGrid: new ol.tilegrid.TileGrid({
						origin: [0, 0],
						resolutions: tileResolutions,
					}),
					tileUrlFunction: function (tileCoord) {
						if (!tileCoord) {
							return "";
						}
						let z = tileCoord[0];
						let x = tileCoord[1];
						let y = tileCoord[2];
						if (x < 0) {
							x = -x;
						}
						if (y < 0) {
							y = -y - 1;
						}
						return (
							"http://maponline3.bdimg.com/tile/?qt=vtile&x=" +
							x +
							"&y=" +
							y +
							"&z=" +
							z +
							"&styles=pl&scaler=1&udt=20210506&from=jsapi3_0"
						);
					},
				});
			} else if (base.kind == "imageTile") {
				let tileResolutions = new Array(19);
				for (let i = 0; i < 19; i++) {
					tileResolutions[i] = Math.pow(2, 18 - i);
				}
				source = new ol.source.TileImage({
					projection: ol.proj.get("baidu"),
					tileGrid: new ol.tilegrid.TileGrid({
						origin: [0, 0],
						resolutions: tileResolutions,
					}),
					tileUrlFunction: function (tileCoord) {
						if (!tileCoord) {
							return "";
						}
						let z = tileCoord[0];
						let x = tileCoord[1];
						let y = tileCoord[2];
						if (x < 0) {
							x = -x;
						}
						if (y < 0) {
							y = -y - 1;
						}
						return "http://shangetu3.map.bdimg.com/it/u=x=" + x + ";y=" + y + ";z=" + z + ";v=009;type=sate&fm=46";
					},
				});
			} else if (base.kind == "imageLabel") {
				let tileResolutions = new Array(19);
				for (let i = 0; i < 19; i++) {
					tileResolutions[i] = Math.pow(2, 18 - i);
				}
				source = new ol.source.TileImage({
					projection: ol.proj.get("baidu"),
					tileGrid: new ol.tilegrid.TileGrid({
						origin: [0, 0],
						resolutions: tileResolutions,
					}),
					tileUrlFunction: function (tileCoord) {
						if (!tileCoord) {
							return "";
						}
						let z = tileCoord[0];
						let x = tileCoord[1];
						let y = tileCoord[2];
						if (x < 0) {
							x = -x;
						}
						if (y < 0) {
							y = -y - 1;
						}
						return "http://online3.map.bdimg.com/tile/?qt=tile&x=" + x + "&y=" + y + "&z=" + z + "&styles=sl&v=020";
					},
				});
			}
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: source,
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载WMTS
		 * @Date: 2021-05-24 11:32:01
		 * @param {*} base
		 */
		function loadWMTS(base) {
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.Tile({
				source: base.source,
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载mvt
		 * @Date: 2021-10-13 17:33:25
		 * @param {*} base
		 */
		function loadMVT(base) {
			let resolutions = self.transformResolution(base.showLevel);
			let layer = new ol.layer.VectorTile({
				source: base.source,
				minResolution: resolutions[0],
				maxResolution: resolutions[1],
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
		/**
		 * @Author: dongnan
		 * @Description: 加载离线地图
		 * @Date: 2021-03-31 10:31:23
		 * @param {*} base
		 */
		function loadWebTile(base) {
			let layer = new ol.layer.Tile({
				source: new ol.source.XYZ({
					url: base.url, //例如:tianditu/image/{z}/{x}/{y}.jpg
					projection: base.projection || ol.proj.get("EPSG:4326"),
				}),
				zIndex: base.zIndex,
				noSwitcherDelete: base.noSwitcherDelete, //永远不被删除
				allwaysOnTop: base.allwaysOnTop, //永远在上层
				displayInLayerSwitcher: base.displayInLayerSwitcher, //是否在layer内显示
			});
			return layer;
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 显示层级转为minResolution、maxResolution
	 * @Date: 2021-03-25 21:29:45
	 * @param {*} showLevel 显示层级 默认['UNLIMIT','UNLIMIT']
	 */
	transformResolution(showLevel) {
		let minResolution = 0;
		let maxResolution = 1;
		if (showLevel) {
			if (showLevel[0] != "UNLIMIT") {
				maxResolution = this.olMap.getView().getResolutionForZoom(showLevel[0]);
			}
			if (showLevel[1] != "UNLIMIT") {
				minResolution = this.olMap.getView().getResolutionForZoom(showLevel[1]);
			}
		}
		return [minResolution, maxResolution];
	}
	/**
	 * @Author: dongnan
	 * @Description: 改变图层显示层级
	 * @Date: 2021-10-15 23:28:54
	 * @param {*} layer 图层或图层id
	 * @param {*} showLevel
	 */
	changeShowLevel(layer, showLevel) {
		let pLayer = null;
		if (typeof layer == "string") {
			pLayer = this.getLayer(layer);
		} else {
			pLayer = layer;
		}
		let resolutions = this.transformResolution(showLevel);
		pLayer.setMinResolution(resolutions[0]);
		pLayer.setMaxResolution(resolutions[1]);
	}
	/**
	 * @Author: dongnan
	 * @Description: 根据baseOptions中的id加载layer
	 * @Date: 2021-03-24 22:08:50
	 * @param {*} id
	 */
	switchBase(id) {
		let newLayers = [];
		//当加载全部时
		if (id == "all") {
			this.baseLayers.some((base) => {
				this.olMap.addLayer(base);
				newLayers.push(base);
			});
		} else {
			// 找到配置
			for (let i = 0; i < this.baseOptions.length; i++) {
				if (this.baseOptions[i].id.toString() == id.toString()) {
					// 根据配置中layers索引加载baseLayer
					let ids = this.baseOptions[i].layers || [];
					this.baseLayers.some((base, i) => {
						if (ids.indexOf(i) >= 0) {
							base.zIndex = 1;
							newLayers.push(base);
						}
					});
					break;
				}
			}
		}
		if (this.baseGroup) {
			this.olMap.removeLayer(this.baseGroup);
			this.baseGroup = null;
		}
		this.baseGroup = new ol.layer.Group({
			title: "基础底图",
			allwaysOnTop: true, //永远在图层上层
			noSwitcherDelete: true, //永远不被删除
			openInLayerSwitcher: true, //默认展开
			displayInLayerSwitcher: false, //在图层控件中显示
			baseLayer: true, //独见性
			layers: newLayers,
		});
		this.olMap.addLayer(this.baseGroup);
	}
	/**
	 * @Author: dongnan
	 * @Description: 根据baseOptions中的id读取layer
	 * @Date: 2023-11-14 18:18:26
	 * @param {*} id
	 */
	getBase(id) {
		let result = [];
		// 找到配置
		for (let i = 0; i < this.baseOptions.length; i++) {
			if (this.baseOptions[i].id.toString() == id.toString()) {
				// 根据配置中layers索引加载baseLayer
				let ids = this.baseOptions[i].layers || [];
				this.baseLayers.some((base, i) => {
					if (ids.indexOf(i) >= 0) {
						base.zIndex = 1;
						result.push(base);
					}
				});
				break;
			}
		}
		return result;
	}
	/**
	 * @Author: dongnan
	 * @Description: 获取限制参数
	 * @Date: 2021-03-21 21:22:44
	 */
	getExtent() {
		let resolution = this.view.getResolution();
		let xL = this.div.clientWidth * resolution;
		let yL = this.div.clientHeight * resolution;
		let center = this.view.getCenter();
		return [center[0] - xL / 2, center[1] - yL / 2, center[0] + xL / 2, center[1] + yL / 2];
	}
	/**
	 * @Author: dongnan
	 * @Description: 根据图层id获取图层对象(针对使用本插件方法添加的id)
	 * @Date: 2021-03-22 21:19:21
	 * @param {*} id 图层id
	 */
	getLayer(id) {
		for (let i = 0; i < this.layers.length; i++) {
			if (this.layers[i].id == id) {
				return this.layers[i];
			}
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 添加冒泡框
	 * @Date: 2021-10-16 00:19:00
	 * @param {*} html 超文本内容 "<div>test</div>"
	 * @param {*} position 位置坐标点(必填) [x,y]
	 * @param {*} positioning 默认"bottom-center"
	 * @param {*} className 默认"ol-overlay-container ol-selectable"
	 * @param {*} offset 默认[0,0]
	 * @param {*} insertFirst 是否置于最底层 默认否
	 */
	addPopup(option) {
		let element = document.createElement("div");
		element.innerHTML = `<div class="ol-popup">` + option.html + `</div>`;
		let id = option.id || this.randomString(12);
		let overlay = new ol.Overlay({
			id: id,
			element: element,
			position: option.position,
			positioning: option.positioning || "bottom-center",
			className: option.className || "ol-overlay-container ol-selectable",
			offset: option.offset || [0, 0],
			insertFirst: option.insertFirst || false,
			stopEvent: true,
		});
		this.popups.push(overlay);
		this.olMap.addOverlay(overlay);
		return overlay;
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除冒泡框
	 * @Date: 2021-10-16 00:19:21
	 * @param {*} overlay
	 */
	removePopup(overlay) {
		let del = [];
		this.popups.some((item) => {
			if (item == overlay) {
				this.olMap.removeOverlay(overlay);
				del.push(overlay);
				return true;
			}
		});
		for (let temp of del) {
			let i = this.popups.indexOf(temp);
			this.popups.splice(i, 1);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除所有冒泡框(不包括list内)
	 * @Date: 2021-10-16 00:19:50
	 * @param {*} list [overlay,overlay]
	 */
	removeAllPopupWithout(list) {
		let del = [];
		list = Array.isArray(list) && list.length > 0 ? list : [];
		this.popups.some((item) => {
			if (list.indexOf(item) < 0) {
				this.olMap.removeOverlay(item);
				del.push(item);
			}
		});
		for (let temp of del) {
			let i = this.popups.indexOf(temp);
			this.popups.splice(i, 1);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description:添加事件
	 * @Date: 2021-03-21 22:34:26
	 * @param {*} type 事件大类
	 * @param {*} kind 具体类型
	 * @param {*} layer 指定图层(也可为字符串唯一id,常用于moveend事件)
	 * @param {*} listener 监听事件
	 */
	addEvent(type, kind, layer, listener) {
		if (kind != "all") {
			if (typeof layer == "string") {
				layer = this.getLayer(layer);
			}
		}
		this.events.pushHead({
			type: type,
			kind: kind,
			layer: layer,
			listener: listener,
		});
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除事件
	 * @Date: 2021-03-22 20:45:06
	 * @param {*} type 事件大类
	 * @param {*} kind 具体类型
	 * @param {*} layerId 图层或事件标识id
	 */
	removeEvent(type, kind, layerId) {
		let del = [];
		this.events.some((item) => {
			if (kind == "all") {
				if (item.type == type && item.kind == kind && item.layer == layerId) {
					del.push(item);
				}
			} else {
				if (item.type == type && item.kind == kind && item.layer.id == layerId) {
					del.push(item);
				}
			}
		});
		for (let temp of del) {
			let i = this.events.indexOf(temp);
			this.events.splice(i, 1);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除指定图层的所有事件
	 * @Date: 2021-04-01 14:04:23
	 * @param {*} layer 图层或图层id
	 */
	removeEventByLayer(layer) {
		let del = [];
		let layerId = null;
		if (typeof layer == "string") {
			layerId = layer;
		} else {
			layerId = layer.id;
		}
		if (!layerId) return;
		for (let i = 0; i < this.events.length; i++) {
			if (this.events[i].layer.id === layerId) {
				del.push(this.events[i]);
			}
		}
		for (let temp of del) {
			let i = this.events.indexOf(temp);
			this.events.splice(i, 1);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 去除单个图层
	 * @Date: 2021-04-01 15:43:12
	 * @param {*} layer 图层或图层id
	 */
	removeLayer(layer) {
		let layerId = null;
		let del = [];
		if (typeof layer == "string") {
			layerId = layer;
		} else {
			layerId = layer.id;
		}
		if (!layerId) return;
		// 去除图层事件
		this.removeEventByLayer(layerId);
		// 去除图层
		this.layers.some((item, index) => {
			if (item.id == layerId) {
				this.olMap.removeLayer(this.layers[index]);
				del.push(item);
				return true;
			}
		});
		for (let temp of del) {
			let i = this.layers.indexOf(temp);
			this.layers.splice(i, 1);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除所有所添加的图层及图层上的事件(不包括list内的图层)
	 * @Date: 2021-04-02 09:40:00
	 * @param {*} list ["firstLayer","secondLayer","thirdLayer","fourthLayer"]
	 */
	removeAllLayerWithout(list) {
		let del = [];
		list = Array.isArray(list) && list.length > 0 ? list : [];
		this.layers.some((item) => {
			if (list.indexOf(item.id) < 0) {
				del.push(item);
			}
		});
		for (let temp of del) {
			this.removeLayer(temp);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 去除全局事件，不包含图层事件，即kind为all的事件(不包括list内的图层)
	 * @Date: 2021-10-15 23:57:47
	 * @param {*} list ["MapGrid"]
	 */
	removeAllEventWithout(list) {
		let del = [];
		list = Array.isArray(list) && list.length > 0 ? list : [];
		this.events.some((item) => {
			if (item.kind == "all") {
				if (list.indexOf(item.layer) < 0) {
					del.push(item);
				}
			}
		});
		for (let temp of del) {
			let i = this.events.indexOf(temp);
			this.events.splice(i, 1);
		}
	}
	// 添加layer
	addLayer(layer) {
		this.olMap.add(layer);
		this.layers.push(layer);
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2021-03-22 21:09:19
	 * @param {*} id 图层id
	 * @param {*} style 样式
	 * @param {*} source 数据源 默认空矢量数据源
	 * @param {*} showLevel 显示层级 ['UNLIMIT','UNLIMIT'] [3,12]
	 * @param {*} events 图层事件 [{"type":"singleclick","kind":"featureClick",listener":fun},{"type":"pointermove","kind":"featureMove",listener":fun2}]
	 * @param {*} zIndex 图层叠加层次
	 */
	addVectorLayer(option) {
		let resolutions = this.transformResolution(option.showLevel);
		let vectorLayer = new ol.layer.Vector({
			source: option.source || new ol.source.Vector(),
			style: option.style || new ol.style.Style({}),
			zIndex: option.zIndex || 30,
			minResolution: resolutions[0],
			maxResolution: resolutions[1],
			allwaysOnTop: option.allwaysOnTop || false,
			displayInLayerSwitcher: option.displayInLayerSwitcher || false,
			noSwitcherDelete: option.noSwitcherDelete || false,
			title: option.title || "",
		});
		vectorLayer.id = option.id || this.randomString(32);
		// 添加事件
		if (Array.isArray(option.events) && option.events.length > 0) {
			for (let event of option.events) {
				if (event.type && event.kind && typeof event.listener == "function") {
					this.addEvent(event.type, event.kind, vectorLayer, event.listener);
				}
			}
		}
		// 存储起来
		this.layers.push(vectorLayer);
		// 添加到map中
		this.olMap.addLayer(vectorLayer);
		return vectorLayer;
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2021-10-13 14:25:54
	 * @param {*} id 图层id
	 * @param {*} wmsOptions wms配置{url:服务地址,layers:图层,format:"image/png",transparent:"true",version:"1.1.0",cql_filter:过滤条件,serverType:"geoserver"}
	 * @param {*} showLevel 显示层级 ['UNLIMIT','UNLIMIT'] [3,12]
	 * @param {*} zIndex 图层叠加层次
	 */
	addWmsLayer(option) {
		let resolutions = this.transformResolution(option.showLevel);
		let wmsLayer = new ol.layer.Tile({
			source: new ol.source.TileWMS({
				url: option.wmsOptions.url,
				params: {
					LAYERS: option.wmsOptions.layers,
					FORMAT: option.wmsOptions.format || "image/png",
					TRANSPARENT: option.wmsOptions.transparent || "true",
					VERSION: option.wmsOptions.version || "1.1.0",
					CQL_FILTER: option.wmsOptions.cql_filter,
				},
				serverType: option.wmsOptions.serverType || "geoserver", //'mapserver'
			}),
			zIndex: option.zIndex || 10,
			minResolution: resolutions[0],
			maxResolution: resolutions[1],
		});
		wmsLayer.id = option.id || this.randomString(32);
		// 存储起来
		this.layers.push(wmsLayer);
		// 添加到map中
		this.olMap.addLayer(wmsLayer);
		return wmsLayer;
	}
	/**
	 * @Author: dongnan
	 * @Description: 随机生成id
	 * @Date: 2020-12-24 20:31:51
	 * @param {*} len id长度
	 */
	randomString(len) {
		len = len || 12;
		let $chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
		let maxPos = $chars.length;
		let pwd = "";
		for (let i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}
	/**
	 * @Author: dongnan
	 * @Description: 转为geojson
	 * @Date: 2021-03-23 15:20:03
	 * @param {*} list
	 * @param {*} xName
	 * @param {*} yName
	 */
	toGeojson(list, xName, yName) {
		let features = [];
		list.some((item, index) => {
			item.order = index + 1;
			if (!!item[xName] && !!item[yName]) {
				let feature = {
					type: "Feature",
					properties: item,
					geometry: {
						type: "Point",
						coordinates: [parseFloat(item[xName]), parseFloat(item[yName])],
					},
				};
				features.push(feature);
			} else {
				return false;
			}
		});
		let geojson = {
			type: "FeatureCollection",
			features: features,
		};
		return geojson;
	}
	/**
	 * @Author: dongnan
	 * @Description: 缩放到指定层级位置
	 * @Date: 2021-03-23 16:18:33
	 * @param {*} center 中心点
	 * @param {*} zoom 指定层级
	 * @param {*} duration 动画效果
	 */
	zoomTo(center, zoom, duration, callback) {
		if (duration) {
			this.olMap.getView().animate({
				zoom: zoom,
				center: center,
				duration: duration,
				callback: callback,
			});
		} else {
			if (center) this.olMap.getView().setCenter(center);
			if (zoom) this.olMap.getView().setZoom(zoom);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2023-11-16 15:50:51
	 * @param {*} extent 范围
	 * @param {*} padding [上,右,下,左]
	 * @param {*} duration 动画时间
	 */
	zoomToExtent(extent, padding, duration = 0) {
		padding = padding || [0, 0, 0, 0];
		this.view.fit(extent, { padding: padding, duration: duration });
	}
	/**
	 * @Author: dongnan
	 * @Description: 定位
	 * @Date: 2021-10-28 15:47:32
	 * @param {*} list
	 * @param {*} xName
	 * @param {*} yName
	 * @param {*} padding [上,右,下,左]
	 */
	toExtent(list, xName, yName, padding, callback) {
		let array = [];
		list.some((item) => {
			if (!!item[xName] && !!item[yName]) {
				array.push([parseFloat(item[xName]), parseFloat(item[yName])]);
			} else {
				return false;
			}
		});
		if (array.length == 0) {
			return;
		} else if (array.length == 1) {
			// this.zoomTo(array[0], 15);
			return;
		} else {
			let line = turfLineString(array);
			let bbox = turfBBox(line);
			padding = padding || [100, 100, 100, 100];
			this.view.fit(bbox, { padding: padding, duration: 500, callback: callback });
		}
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2021-03-27 20:10:56
	 * @param {*} layer 图层或图层id
	 * @param {*} geojson
	 */
	addFeaturesByGeojson(layer, geojson) {
		let pLayer = null;
		if (typeof layer == "string") {
			pLayer = this.getLayer(layer);
		} else {
			pLayer = layer;
		}
		let features = new ol.format.GeoJSON().readFeatures(geojson);
		pLayer.getSource().addFeatures(features);
		return features;
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除图层数据
	 * @Date: 2021-03-30 22:11:39
	 * @param {*} layer 图层id或者图层
	 */
	removeFeatures(layer) {
		let pLayer = null;
		if (typeof layer == "string") {
			pLayer = this.getLayer(layer);
		} else {
			pLayer = layer;
		}
		pLayer.getSource().clear();
	}

	/**
	 * @Author: dongnan
	 * @Description: 透明度颜色
	 * @Date: 2021-03-23 14:32:52
	 * @param {*} color
	 * @param {*} opacity
	 */
	colorRgb(color, opacity) {
		let reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
		let sColor = color.toLowerCase();
		if (sColor && reg.test(sColor)) {
			if (sColor.length === 4) {
				let sColorNew = "#";
				for (let i = 1; i < 4; i += 1) {
					sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
				}
				sColor = sColorNew;
			}
			//处理六位的颜色值
			let sColorChange = [];
			for (let i = 1; i < 7; i += 2) {
				sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
			}
			if (!opacity) return "RGB(" + sColorChange.join(",") + ")";
			else {
				sColorChange.push(opacity);
				return "rgba(" + sColorChange.join(",") + ")";
			}
		} else {
			return sColor;
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 细分点(中国范围内)
	 * @Date: 2021-10-27 14:13:02
	 * @param {*} p1 [x,y]
	 * @param {*} p2 [x,y]
	 * @param {*} num 细分点数 5
	 */
	subDividePoints(p1, p2, num) {
		let x1 = parseFloat(p1[0]);
		let x2 = parseFloat(p2[0]);
		let y1 = parseFloat(p1[1]);
		let y2 = parseFloat(p2[1]);
		let xDistance = 0;
		let yDistance = 0;
		let list = [];
		num = parseInt(num) || 5;
		if (x1 > 0 && x2 > 0 && (y1 > 0) & (y2 > 0)) {
			if (x1 < x2) {
				xDistance = (x2 - x1) / (num - 1);
				if (y1 < y2) {
					yDistance = (y2 - y1) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 + i * xDistance, y1 + i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 > y2) {
					yDistance = (y1 - y2) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 + i * xDistance, y1 - i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 == y2) {
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 + i * xDistance, y1];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				}
			} else if (x1 > x2) {
				xDistance = (x1 - x2) / (num - 1);
				if (y1 < y2) {
					yDistance = (y2 - y1) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 - i * xDistance, y1 + i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 > y2) {
					yDistance = (y1 - y2) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 - i * xDistance, y1 - i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 == y2) {
					for (let i = 1; i < num - 1; i++) {
						let array = [x1 - i * xDistance, y1];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				}
			} else if (x1 == x2) {
				if (y1 < y2) {
					yDistance = (y2 - y1) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1, y1 + i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 > y2) {
					yDistance = (y1 - y2) / (num - 1);
					for (let i = 1; i < num - 1; i++) {
						let array = [x1, y1 - i * yDistance];
						list.push(array);
					}
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				} else if (y1 == y2) {
					list.pushHead([x1, y1]);
					list.push([x2, y2]);
				}
			}
		}
		return list;
	}
}
export default MapClass;
