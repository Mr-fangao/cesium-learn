
import { GetPickedRayPositionWGS84, SetEntity, RemoveEntities, GetCamera, CameraGoTo } from '@/utils/cesium/CesiumViewer.js';
import { GlobalState } from '@/buss/GlobalState';
import coordinate from '@/utils/cesium/Coordinates.js';

var firstpoint={
	windowpos:new Cesium.Cartesian2(),
	cartesianpos:new Cesium.Cartesian3()
};
var secondpoint={
	windowpos:new Cesium.Cartesian2(),
	cartesianpos:new Cesium.Cartesian3()
};

var dengfennum=100;
var sectionanalysisentityid = "sectionanalysisentityid";//剖面分析在主场景中entity的id前缀

function HandleMouseFirstClick(windowposfirst) {
	let cartesianfirst = GetPickedRayPositionWGS84(windowposfirst).ToCartesian();
	firstpoint.windowpos.x=windowposfirst.x;
	firstpoint.windowpos.y=windowposfirst.y;
	firstpoint.cartesianpos.x=cartesianfirst.x;
	firstpoint.cartesianpos.y=cartesianfirst.y;
	firstpoint.cartesianpos.z=cartesianfirst.z;
	drawpoint(sectionanalysisentityid+"_first",cartesianfirst);
}

function HandleMouseSecondClick(windowpossecond) {
	let cartesiansecod = GetPickedRayPositionWGS84(windowpossecond).ToCartesian();
	secondpoint.windowpos.x=windowpossecond.x;
	secondpoint.windowpos.y=windowpossecond.y;
	secondpoint.cartesianpos.x=cartesiansecod.x;
	secondpoint.cartesianpos.y=cartesiansecod.y;
	secondpoint.cartesianpos.z=cartesiansecod.z;
	drawpoint(sectionanalysisentityid+"_second",cartesiansecod);
}

function HandleMouseMove(windowposmove) {
	let movepoint = GetPickedRayPositionWGS84(windowposmove);
	if(movepoint!=null)
	{
		movepoint=movepoint.ToCartesian();
		drawline(sectionanalysisentityid+"_line",[firstpoint.cartesianpos,movepoint]);
	}

}

function GetDrawEchartData() {
	let datalist=[];
	let firstpointwgs84 = GetPickedRayPositionWGS84(firstpoint.windowpos);
	let secondpointwgs84 = GetPickedRayPositionWGS84(secondpoint.windowpos);
	let nowcamera=GetCamera();
	let dis=coordinate.CoordinateWGS84.GetDistancePlane(firstpointwgs84,secondpointwgs84);
	CameraGoTo((firstpointwgs84.latitude+secondpointwgs84.latitude)/2,
		(firstpointwgs84.longitude+secondpointwgs84.longitude)/2,
		dis,nowcamera.heading,-90,0);
	//获得新camera下第一个点和最后一个点的屏幕坐标
	let firstwindownewpos=Cesium.SceneTransforms.wgs84ToWindowCoordinates(GlobalState.getInstance().viewer.scene, firstpointwgs84.ToCartesian());
	let secondwindownewpos=Cesium.SceneTransforms.wgs84ToWindowCoordinates(GlobalState.getInstance().viewer.scene, secondpointwgs84.ToCartesian());
	datalist.push({
		id:0,
		longitude:firstpointwgs84?firstpointwgs84.longitude:0,
		latitude:firstpointwgs84?firstpointwgs84.latitude:0,
		height:firstpointwgs84?firstpointwgs84.height:0
	});
	for(let i=1;i<dengfennum;i++){
		//  let windowpos=Cesium.Cartesian2.lerp(firstpoint.windowpos,secondpoint.windowpos, i/dengfennum, new Object());
		let windowpos=Cesium.Cartesian2.lerp(firstwindownewpos,secondwindownewpos, i/dengfennum, new Object());
		let windowpos2=new Cesium.Cartesian2(windowpos.x,windowpos.y);
		let wgs84pos = GetPickedRayPositionWGS84(windowpos2);
		datalist.push({
			id:i,
			longitude:wgs84pos?wgs84pos.longitude:0,
			latitude:wgs84pos?wgs84pos.latitude:0,
			height:wgs84pos?wgs84pos.height:0
		})
		// drawpoint(sectionanalysisentityid+i,wgs84pos.ToCartesian());
	}
	datalist.push({
		id:dengfennum,
		longitude:secondpointwgs84?secondpointwgs84.longitude:0,
		latitude:secondpointwgs84?secondpointwgs84.latitude:0,
		height:secondpointwgs84?secondpointwgs84.height:0
	});
	CameraGoTo(nowcamera.latitude,
		nowcamera.longitude,
		nowcamera.height,nowcamera.heading,nowcamera.pitch,nowcamera.roll);
	return datalist;
}

function ClearEntity() {
	RemoveEntities(sectionanalysisentityid+"_first");
	RemoveEntities(sectionanalysisentityid+"_second");
	RemoveEntities(sectionanalysisentityid+"_line");
}

function drawpoint(entityid,cartesianpoi) {
	//画点
	SetEntity(new Cesium.Entity({
		id: entityid,
		position: cartesianpoi,
		point: {
			pixelSize: 10,
			color: Cesium.Color.WHITE,
			disableDepthTestDistance: 0
		}
	}));
}

function drawline(entityid,cartesianpois) {
	//画线
	SetEntity(new Cesium.Entity({
		id: entityid,
		polyline: {
			positions: cartesianpois,
			material: new Cesium.Color(1, 1, 1, 1),
			width: 2,
			clampToGround: true
		}
	}));
}

export default {
	HandleMouseMove,
	HandleMouseFirstClick,
	HandleMouseSecondClick,
	ClearEntity,
	GetDrawEchartData
}
