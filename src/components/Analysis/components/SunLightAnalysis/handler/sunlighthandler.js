import msgUtil from '@/buss/MessageUtil.js';
import Bus from '@/buss/eventBus.js';
import shadowquery from "./shadowquery";
import { GlobalState } from '@/buss/GlobalState';
import { GetPickedRayPositionWGS84, SetEntity, RemoveEntities } from '@/utils/cesium/CesiumViewer.js';

let shadowQuery, tooltip, viewer, shadowQueryPoints, positions;
let drawLeftClicked = false;
let vueInstance = {};
const ENTITYPRE="SPACEANALYSISSUNLIGHT";


function init() {
	viewer = GlobalState.getInstance().viewer;
	//创建阴影查询对象
	shadowQuery = new shadowquery.ShadowQuery(viewer);
}
//激活日照阴影分析
function shadowAnalysis() {
    if(tooltip){
        tooltip.setVisible(false);
    }
    tooltip = msgUtil.createTooltip(viewer._element);
	positions = [];
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, ondrawleftclick);
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Right_Click, ondrawrightclick);
    Bus.VM.$on(Bus.SignalType.Scene_Mouse_Move, ondrawmousemove);
}

function ondrawleftclick(e) {
	let wgs84pos= GetPickedRayPositionWGS84(e.position);
	if(wgs84pos==null) return;
    if (positions.length > 0) {
        positions[positions.length - 1] = wgs84pos;
    }
    else {
        positions.push(wgs84pos);
    }
    //画线
    SetEntity(new Cesium.Entity({
        id: ENTITYPRE + "poi" + positions.length.toString(),
        position: wgs84pos.ToCartesian(),
        point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            // scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
            disableDepthTestDistance: 0
        }
    }));
    drawLeftClicked = true;
}

function ondrawrightclick(e) {
    if(positions.length<3){
		msgUtil.messagePrompt('warning', '分析区域请至少绘制三个点');
		return;
	}
    let pos = GetPickedRayPositionWGS84(e.position);
    if (!pos) return;

	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, ondrawleftclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, ondrawrightclick);
    Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, ondrawmousemove);
    tooltip.setVisible(false);
	
	let dateValue = vueInstance.chooseTime.value;
	let startTime = new Date(dateValue);
	startTime.setHours(Number(vueInstance.startTime.value.toString()));
	let endTime = new Date(dateValue);
	endTime.setHours(Number(vueInstance.endTime.value.toString()));
	// shadowQuery.timeInterval = 60;//时间间隔
	shadowQuery.Update({
		poilist:positions,
		bottomheight:Number(vueInstance.bottomHeight.value),
		extrudeheight:Number(vueInstance.extrudeHeight.value),
		spacing:Number(vueInstance.spacing.value),//阴影率点的间距
		startTime:Cesium.JulianDate.fromDate(startTime),
		endTime:Cesium.JulianDate.fromDate(endTime)
	});

}

function ondrawmousemove(e) {
    // tooltip提示
    let tip = "";
    switch (positions.length) {
        case 0:
            tip = '<p>点击绘制第一个点</p>';
            break;
        case 2:
            tip = '<p>点击绘制第二个点</p>';
            break;
        case 3:
            tip = '<p>点击绘制第三个点</p>';
            break;
        default:
            tip = '<p>点击绘制点，或者右击结束绘制</p>';
            break;
    }
    tooltip.showAt(e.endPosition, tip);

	if(positions.length === 0) return;
    let pos = GetPickedRayPositionWGS84(e.endPosition);
    if (!pos) return;

    if(drawLeftClicked){
    	positions.push(pos);
        drawLeftClicked = false;
	}else{
        positions[positions.length - 1] = pos;
	}
    //画点
    SetEntity(new Cesium.Entity({
        id: ENTITYPRE + "poi" + positions.length.toString(),
        position: pos.ToCartesian(),
        point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            // scaleByDistance:new Cesium.NearFarScalar(0, 0, 1, 1),
            disableDepthTestDistance: 0
        }
    }));
    //画线
	let tempArr = positions.slice(0, positions.length-1);
    let cartesians =  tempArr.map(poi => {return poi.ToCartesian()});
    cartesians.push(pos.ToCartesian());
    cartesians.push(positions[0].ToCartesian());
    SetEntity(new Cesium.Entity({
        id: ENTITYPRE + "polyline0",
        polyline: {
            positions: cartesians,
            material: new Cesium.Color(0, 1, 0, 0.6),
            width: 2,
            // depthFailMaterial:this.Color.ToCesiumColor()
        }
    }));
}

//获取日照率
function getShadowTooltip() {
	if (tooltip) {
		tooltip.setVisible(false);
	}
	tooltip = msgUtil.createTooltip(viewer._element);
	Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click,onleftclick);
}

//关闭日照阴影分析
function closeShadowQuery(clearButton) {
	// if (tooltip) {
	// 	tooltip.setVisible(false);
	// }
	// if (drawHandler && drawHandler.polygon != undefined)
	// 	drawHandler.polygon.show = false;
	// if (drawHandler && drawHandler.polyline != undefined)
	// 	drawHandler.polyline.show = false;
	// Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click,onleftclick);
	// GlobalState.getInstance().clearDrawHandler();
	// if (viewer) {
	// 	GlobalState.getInstance().RemoveEntityById("shadowTooltip");
	// 	//viewer.entities.removeAll();
	// }
	// if (clearButton) {
	//
	// } else {
	// 	vueInstance.startTime = '10';
	// 	vueInstance.endTime = '12';
	// 	vueInstance.bottomHeight = 0;
	// 	vueInstance.extrudeHeight = 30;
	// 	vueInstance.spacing = 3;
	// }
	// shadowQuery.qureyRegion({
	// 	position: [0, 0],
	// 	bottom: 0,
	// 	extend: 0
	// });
}

function onleftclick(e) {
	// let position1 = viewer.scene.pickPosition(e.position);
	// let cartographic = Cesium.Cartographic.fromCartesian(position1);
	// let shadowRadio = shadowQuery.getShadowRadio(cartographic);
	// let longitude = Cesium.Math.toDegrees(cartographic.longitude);
	// let latitude = Cesium.Math.toDegrees(cartographic.latitude);
	// let height = cartographic.height;
	// viewer.entities.removeById('shadowTooltip');
	// if (shadowRadio != -1) {
	// 	let showText = '日照率为：' + shadowRadio + '</br>' + '经度为：' + longitude.toFixed(5) + '</br>' + '纬度为：' + latitude.toFixed(5) + '</br>' + '高度为：' + height.toFixed(5) + '</br>';
	// 	tooltip.showAt(e.position, showText);
	// 	viewer.entities.add(new Cesium.Entity({
	// 		id: 'shadowTooltip',
	// 		point: new Cesium.PointGraphics({
	// 			color: new Cesium.Color(1, 0, 0, 0.5),
	// 			pixelSize: 15
	// 		}),
	// 		position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 0.1)
	// 	}));
	// }
}

//刷新日照分析
function updateShadowAnlysis(shadowQueryAtt) {
	if (!isNaN(shadowQueryAtt.startTime) && shadowQueryAtt.startTime != shadowQuery.startTime) {
		//viewer.entities.removeAll();
		let startTime = new Date(shadowQueryAtt.selDate);
		startTime.setHours(Number(shadowQueryAtt.startTime));
		shadowQuery.startTime = Cesium.JulianDate.fromDate(startTime);
	}
	if (!isNaN(shadowQueryAtt.endTime) && shadowQueryAtt.endTime != shadowQuery.endTime) {
		//viewer.entities.removeAll();
		let endTime = new Date(shadowQueryAtt.selDate);
		endTime.setHours(Number(shadowQueryAtt.endTime));
		shadowQuery.endTime = Cesium.JulianDate.fromDate(endTime);
	}
	if (!isNaN(shadowQueryAtt.bottomHeight)) {
		let bh = Number(shadowQueryAtt.bottomHeight);
		let eh = Number(shadowQueryAtt.extrudeHeight);
		shadowQuery.qureyRegion({
			position: shadowQueryPoints,
			bottom: bh,
			extend: eh
		});
	}
	if (!isNaN(shadowQueryAtt.extrudeHeight)) {
		let bh = Number(shadowQueryAtt.bottomHeight);
		let eh = Number(shadowQueryAtt.extrudeHeight);
		shadowQuery.qureyRegion({
			position: shadowQueryPoints,
			bottom: bh,
			extend: eh
		});
	}
	if (!isNaN(shadowQueryAtt.spacing) && shadowQueryAtt.spacing != shadowQuery.spacing) {
		shadowQuery.spacing = Number(shadowQueryAtt.spacing);
	}
}

function clearSunlight() {
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Left_Click, ondrawleftclick);
	Bus.VM.$off(Bus.SignalType.Scene_Mouse_Right_Click, ondrawrightclick);
    Bus.VM.$off(Bus.SignalType.Scene_Mouse_Move, ondrawmousemove);
    if(tooltip){tooltip.setVisible(false)}

    RemoveEntities(ENTITYPRE + "poi");
    RemoveEntities(ENTITYPRE + "polyline0");
    shadowQuery.clear();
}

function SetVueInstance(vueinstance) {
	vueInstance=vueinstance;
}
export default {
	shadowAnalysis,
	getShadowTooltip,
	clearSunlight,
    closeShadowQuery,
	updateShadowAnlysis,
	init,
	SetVueInstance
}
