/*
 * @Author: liqifeng
 * @Date: 2025-03-12 09:54:26
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-12 09:56:33
 * @Description: 
 */
(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define([], factory);
	} else if (typeof exports === "object") {
		module.exports = factory();
	} else {
		global.FyConfig = factory();
	}
})(typeof window !== "undefined" ? window : this, function () {
	const Tdtkey = "507fb0c40dd915b2c0bed8a7c42300cb";
	const weatherapi = "https://restapi.amap.com/v3/weather/weatherInfo?city=350200&key=1285054791b4878850efee90e9689a6d&extensions=all";
	const areaCode = "370982";
	const cityCode = "320100"; //天气-南京=
	const config = {
		localmap: "",
		cesiumIonAccessToken:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2U2YmQ3ZS02YjRhLTQ2NjktYjk0NS02ZDljYmI3ZTA3NGEiLCJpZCI6MTU4MjQyLCJpYXQiOjE2OTEwNDk2NDR9.hxiHqOv1frXtaMuMfRXmEACawaObIAP1HpquQU_BYY0",
	};
	const clusterst = {
		mincluster: 5,
		list: [30, 50, 60, 80, 90, 180],
		radius: 10000,
		maxheight: 10000,
	};
	return {
		viewer: null,
		weatherapi,
		areaCode,
		config,
		Tdtkey,
		clusterst,
		cityCode,
	};
});
