//常用坐标转换

/**
 * WGS84
 */
function CoordinateWGS84(longitude, latitude, height) {
	this.longitude = longitude;
	this.latitude = latitude;
	this.height = height;
}

CoordinateWGS84.fromMercator = function (mercator) {
	var x = (mercator.Mercator_X / 20037508.34) * 180;
	var y = (mercator.Mercator_Y / 20037508.34) * 180;
	y = (180 / Math.PI) * (2 * Math.atan(Math.exp((y * Math.PI) / 180)) - Math.PI / 2);
	return new CoordinateWGS84(x, y, mercator.height);
};
CoordinateWGS84.from84 = function (x, y, height) {
	return new CoordinateWGS84(x, y, height);
};
CoordinateWGS84.fromMercatorxyh = function (mercatorx, mercatory, height) {
	return CoordinateWGS84.fromMercator(new CoordinateMercator(mercatorx, mercatory, height));
};
CoordinateWGS84.prototype.ToCartesian = function () {
	return Cesium.Cartesian3.fromDegrees(this.longitude, this.latitude, this.height);
};
CoordinateWGS84.fromCatesian = function (cartesian) {
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian);
	return new CoordinateWGS84(
		Cesium.Math.toDegrees(cartographic.longitude),
		Cesium.Math.toDegrees(cartographic.latitude),
		cartographic.height,
	);
};
CoordinateWGS84.fromCatesianWithCartographic = function (cartesian) {
	var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
	return new CoordinateWGS84(
		Cesium.Math.toDegrees(cartographic.longitude),
		Cesium.Math.toDegrees(cartographic.latitude),
		cartographic.height,
	);
};

CoordinateWGS84.GetDistancePlane = function (poi1, poi2) {
	var coordinateMercator_poi1 = CoordinateMercator.fromWGS84(poi1);
	var coordinateMercator_poi2 = CoordinateMercator.fromWGS84(poi2);
	return CoordinateMercator.GetDistancePlane(coordinateMercator_poi1, coordinateMercator_poi2);
};

CoordinateWGS84.GetDistancePlaneByList = function (poilist) {
	let dis = 0;
	for (let i = 1; i < poilist.length; i++) {
		dis += CoordinateWGS84.GetDistancePlane(poilist[i - 1], poilist[i]);
	}
	return dis;
};

CoordinateWGS84.GetDistancePlaneWithLocal = function (poi1, poi2) {
	var cartesianpoi1 = poi1.ToCartesian();
	var cartesianpoi2 = poi2.ToCartesian();
	return CoordinateLocal.GetDistancePlane(
		CoordinateLocal.FromCartesian(cartesianpoi1, cartesianpoi1),
		CoordinateLocal.FromCartesian(cartesianpoi2, cartesianpoi1),
	);
};

CoordinateWGS84.GetDistance = function (poi1, poi2) {
	// var coordinateMercator_poi1=CoordinateMercator.fromWGS84(poi1);
	// var coordinateMercator_poi2=CoordinateMercator.fromWGS84(poi2);
	// return CoordinateMercator.GetDistance(coordinateMercator_poi1,coordinateMercator_poi2);

	var cartesianpoi1 = poi1.ToCartesian();
	var cartesianpoi2 = poi2.ToCartesian();
	return CoordinateLocal.GetDistance(
		CoordinateLocal.FromCartesian(cartesianpoi1, cartesianpoi1),
		CoordinateLocal.FromCartesian(cartesianpoi2, cartesianpoi1),
	);
};

CoordinateWGS84.GetSquare = function (poi1, poi2, poi3) {
	var mer1 = CoordinateMercator.fromWGS84(poi1);
	var mer2 = CoordinateMercator.fromWGS84(poi2);
	var mer3 = CoordinateMercator.fromWGS84(poi3);
	return CoordinateMercator.GetSquare(mer1, mer2, mer3);
};
CoordinateWGS84.GetSquareFromPois = function (pois) {
	// var poismer=[];
	// pois.forEach(poi=>{
	//     poismer.push(CoordinateMercator.fromWGS84(poi));
	// });
	// return CoordinateMercator.GetSquareFromPois(poismer);

	if (pois.length <= 0) return 0;
	var poicar0 = pois[0].ToCartesian();
	var poislocal = [];
	for (var i = 0; i < pois.length; i++) {
		poislocal.push(CoordinateLocal.FromCartesian(pois[i].ToCartesian(), poicar0));
	}
	return CoordinateLocal.GetSquare(poislocal);
};

/**
 * Mercator
 */
function CoordinateMercator(x, y, z) {
	this.Mercator_X = x;
	this.Mercator_Y = y;
	this.height = z;
}
CoordinateMercator.fromWGS84 = function (wgs84) {
	var x = (wgs84.longitude * 20037508.34) / 180;
	var y = Math.log(Math.tan(((90 + wgs84.latitude) * Math.PI) / 360)) / (Math.PI / 180);
	y = (y * 20037508.34) / 180;
	return new CoordinateMercator(x, y, wgs84.height);
};
CoordinateMercator.fromWGS84longlatheight = function (longitude, latitude, height) {
	return CoordinateMercator.fromWGS84(new CoordinateWGS84(longitude, latitude, height));
};

CoordinateMercator.GetDistancePlane = function (poi1, poi2) {
	var dx = poi1.Mercator_X - poi2.Mercator_X;
	var dy = poi1.Mercator_Y - poi2.Mercator_Y;
	return Math.sqrt(dx * dx + dy * dy);
};

CoordinateMercator.GetDistance = function (poi1, poi2) {
	var dz = poi1.height - poi2.height;
	var dplane = CoordinateMercator.GetDistancePlane(poi1, poi2);
	return Math.sqrt(dz * dz + dplane * dplane);
};

CoordinateMercator.GetSquare = function (poi1, poi2, poi3) {
	var len1 = CoordinateMercator.GetDistance(poi1, poi2);
	var len2 = CoordinateMercator.GetDistance(poi1, poi3);
	var len3 = CoordinateMercator.GetDistance(poi2, poi3);
	var lenp = (len1 + len2 + len3) / 2;
	return Math.sqrt(lenp * (lenp - len1) * (lenp - len2) * (lenp - len3));
};

CoordinateMercator.GetSquareFromPois = function (pois) {
	var result = 0;
	for (var i = 2; i < pois.length; i++) {
		var poi1 = pois[0];
		var poi2 = pois[i - 1];
		var poi3 = pois[i];
		result += CoordinateMercator.GetSquare(poi1, poi2, poi3);
	}
	return result;
};

/**
 * Local
 */
function CoordinateLocal(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

CoordinateLocal.FromCartesian = function (cartesianpoi, cartesian0) {
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian0); //经纬度弧度
	var m = new Cesium.Matrix4();
	var matrix = new Cesium.Matrix4(1, 0, 0, -cartesian0.x, 0, 1, 0, -cartesian0.y, 0, 0, 1, -cartesian0.z, 0, 0, 0, 1); //平移矩阵

	m = Cesium.Matrix4.multiplyByTranslation(matrix, cartesianpoi, m); //m = m X v
	var result = new Cesium.Cartesian3();
	result = Cesium.Matrix4.getTranslation(m, result);

	var matrix = new Cesium.Matrix4(
		-Math.sin(cartographic.longitude),
		Math.cos(cartographic.longitude),
		0,
		0,
		-Math.cos(cartographic.longitude),
		-Math.sin(cartographic.longitude),
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
	); //绕z轴旋转90+longitude矩阵
	m = Cesium.Matrix4.multiplyByTranslation(matrix, result, m);
	result = Cesium.Matrix4.getTranslation(m, result);

	var matrix = new Cesium.Matrix4(
		1,
		0,
		0,
		0,
		0,
		Math.sin(cartographic.latitude),
		Math.cos(cartographic.latitude),
		0,
		0,
		-Math.cos(cartographic.latitude),
		Math.sin(cartographic.latitude),
		0,
		0,
		0,
		0,
		1,
	); //绕x轴旋转90-latitude矩阵
	m = Cesium.Matrix4.multiplyByTranslation(matrix, result, m);
	result = Cesium.Matrix4.getTranslation(m, result);
	return new CoordinateLocal(result.x, result.y, result.z);
	// const transform = Cesium.Transforms.eastNorthUpToFixedFrame(cartesian0);
	// const transforminvert = new Cesium.Matrix4();
	// Cesium.Matrix4.inverse(transform, transforminvert);
	// const s = Cesium.Matrix4.multiplyByPoint(transforminvert, cartesianpoi, new Cesium.Cartesian3());
	// return new CoordinateLocal(s.x, s.y, s.z);
};

CoordinateLocal.ToCartesian = function (cartesianlocalpoi, cartesian0) {
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(cartesian0); //笛卡尔转经纬度弧度
	var m = new Cesium.Matrix4();
	var matrix = new Cesium.Matrix4(
		1,
		0,
		0,
		0,
		0,
		Math.sin(cartographic.latitude),
		-Math.cos(cartographic.latitude),
		0,
		0,
		Math.cos(cartographic.latitude),
		Math.sin(cartographic.latitude),
		0,
		0,
		0,
		0,
		1,
	); //绕x轴旋转latitude-90矩阵
	m = Cesium.Matrix4.multiplyByTranslation(matrix, cartesianlocalpoi, m); //m = m X v
	var result = new Cesium.Cartesian3();
	result = Cesium.Matrix4.getTranslation(m, result);

	var matrix = new Cesium.Matrix4(
		-Math.sin(cartographic.longitude),
		-Math.cos(cartographic.longitude),
		0,
		0,
		Math.cos(cartographic.longitude),
		-Math.sin(cartographic.longitude),
		0,
		0,
		0,
		0,
		1,
		0,
		0,
		0,
		0,
		1,
	); //绕z轴旋转270-longitude矩阵
	m = Cesium.Matrix4.multiplyByTranslation(matrix, result, m);
	result = Cesium.Matrix4.getTranslation(m, result);

	var matrix = new Cesium.Matrix4(1, 0, 0, cartesian0.x, 0, 1, 0, cartesian0.y, 0, 0, 1, cartesian0.z, 0, 0, 0, 1); //平移矩阵
	m = Cesium.Matrix4.multiplyByTranslation(matrix, result, m);
	result = Cesium.Matrix4.getTranslation(m, result);
	return result;
	// const transform = Cesium.Transforms.eastNorthUpToFixedFrame(cartesian0);
	// const s = Cesium.Matrix4.multiplyByPoint(transform, cartesianlocalpoi, new Cesium.Cartesian3());
	// return s;
};

//计算多个点组成的多边形面积
CoordinateLocal.GetSquare = function (pois) {
	var result = 0;
	for (var i = 2; i < pois.length; i++) {
		var poi1 = pois[0];
		var poi2 = pois[i - 1];
		var poi3 = pois[i];
		// result+=((poi2.X-poi1.X)*(poi3.X-poi1.X)+
		//     (poi2.Y-poi1.Y)*(poi3.Y-poi1.Y)+
		//     (poi2.Z-poi1.Z)*(poi3.Z-poi1.Z))/2;
		result +=
			((poi2.x - poi1.x) * (poi3.y - poi1.y) +
				(poi2.y - poi1.y) * (poi3.z - poi1.z) +
				(poi3.x - poi1.x) * (poi2.z - poi1.z) -
				(poi3.y - poi1.y) * (poi2.z - poi1.z) -
				(poi3.x - poi1.x) * (poi2.y - poi1.y) -
				(poi2.x - poi1.x) * (poi3.z - poi1.z)) /
			2;
	}
	return Math.abs(result);
};

CoordinateLocal.GetDistance = function (localpoi1, localpoi2) {
	var dx = localpoi2.x - localpoi1.x;
	var dy = localpoi2.y - localpoi1.y;
	var dz = localpoi2.z - localpoi1.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
};
CoordinateLocal.GetDistancePlane = function (localpoi1, localpoi2) {
	var dx = localpoi2.x - localpoi1.x;
	var dy = localpoi2.y - localpoi1.y;
	return Math.sqrt(dx * dx + dy * dy);
};
/**
 * 计算从local原点 到targetlocal构成的向量heading 单位弧度
 * @param localpoi1
 * @param localpoi2
 * @constructor
 */
CoordinateLocal.GetHeading = function (targetlocal) {
	let radians_heading = 0;
	if (targetlocal.y == 0) {
		if (targetlocal.x >= 0) {
			radians_heading = Cesium.Math.PI_OVER_TWO;
		} else if (targetlocal.x < 0) {
			radians_heading = Cesium.Math.PI_OVER_TWO * 3;
		}
	} else if (targetlocal.x == 0) {
		if (targetlocal.y >= 0) {
			radians_heading = 0;
		} else if (targetlocal.y < 0) {
			radians_heading = Cesium.Math.PI;
		}
	} else {
		let radiansplane=Math.sqrt(targetlocal.x*targetlocal.x+targetlocal.y*targetlocal.y);
		radians_heading=Math.asin(targetlocal.x/radiansplane);
		if (targetlocal.y < 0) {
			radians_heading = Cesium.Math.PI - Math.asin(targetlocal.x / radiansplane);
		}
	}
	return radians_heading;
};

CoordinateWGS84.GetHeading = function (wgs84poi1, wgs84poi2) {
	let cartesian1 = wgs84poi1.ToCartesian();
	let cartesian2 = wgs84poi2.ToCartesian();
	let targetlocal = CoordinateLocal.FromCartesian(cartesian2, cartesian1);
	return CoordinateLocal.GetHeading(targetlocal);
};

//本地米制转度制
CoordinateLocal.MercatorToDegree = function (lat, alt) {
	return (alt / 111000) * Math.cos((Math.PI * lat) / 180);
};

/**
 * 根据起点，方向，计算到目标高度平面的距离（沿入参方向的距离）
 * @param origin 起点 笛卡尔坐标
 * @param targetpos 在方向上的一个点，用来确定方向 笛卡尔坐标
 * @param targetHeight 目标高度平面 单位米
 * @constructor
 */
function GetDistanceByOriDirAndHeight(origin, targetpos, targetHeight) {
	var direcionlocal = CoordinateLocal.FromCartesian(targetpos, origin);
	var wgs84posorigin = CoordinateWGS84.fromCatesian(origin);
	targetHeight = Math.abs(targetHeight - wgs84posorigin.height);
	var fac = targetHeight / direcionlocal.z;
	var intersectionlocal = new CoordinateLocal(fac * direcionlocal.x, fac * direcionlocal.y, targetHeight);
	return CoordinateLocal.GetDistance(intersectionlocal, new CoordinateLocal(0, 0, 0));
}

/**
 * 获取一连串Cartesian坐标位置构成的线段中指定占比的位置，类似飞行浏览根据当前时间在总时长的占比来取当前时间的坐标
 * @param cartesianlist
 * @param lerp 占比 0-1
 * @constructor wangqiuyan
 */
function GetCartesianBylerp(cartesianlist, lerp) {
	let lens = [];
	let totallen = 0;

	for (let i = 0; i < cartesianlist.length - 1; i++) {
		lens.push(Cesium.Cartesian3.distance(cartesianlist[i], cartesianlist[i + 1]));
		totallen += lens[i];
	}
	let curtotallerp = 0;
	for (let i = 0; i < lens.length; i++) {
		if (curtotallerp == lerp) return cartesianlist[i];
		const curlerp = lens[i] / totallen;
		const nexttotallerp = curtotallerp + curlerp;
		if (nexttotallerp == lerp) return cartesianlist[i + 1];
		if (nexttotallerp < lerp) {
			curtotallerp += curlerp;
		} else {
			let jisuanlerp = lerp - curtotallerp;
			jisuanlerp = jisuanlerp / curlerp;
			return Cesium.Cartesian3.lerp(cartesianlist[i], cartesianlist[i + 1], jisuanlerp, new Cesium.Cartesian3());
		}
	}
	return cartesianlist[cartesianlist.length - 1];
}

export default {
	CoordinateLocal, //本地坐标系
	CoordinateWGS84, //WGS84坐标系
	CoordinateMercator, //墨卡托坐标系
	GetDistanceByOriDirAndHeight, //根据起点，方向，计算到目标高度平面的距离（沿入参方向的距离）
	GetCartesianBylerp,
};
