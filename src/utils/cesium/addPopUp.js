//add by Wangqiuyan 2024-5-17

import {GlobalState} from "@/buss/GlobalState";

export class PopUps{
	constructor(){
		this.instance = null;
		this.pops={};
	}
	static getInstance() {
		if (!this.instance) {
			this.instance = new PopUps();
		}
		return this.instance;
	}
	//这里会返回一个唯一值id，该id在业务层需要保留，作为调用删除RemovePopUp的传参
	AddPopUp(html,lon,lat,height=0,closeselector){
		let htmlOverlay = document.createElement("div");
		htmlOverlay.id=Cesium.createGuid();
		htmlOverlay.innerHTML = html;
		GlobalState.getInstance().viewer.cesiumWidget.container.append(htmlOverlay);
		let animateEvent = function (scene, time) {
			let position = Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat),height);
			let canvasPosition = GlobalState.getInstance().viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());

			if (Cesium.defined(canvasPosition)) {
				htmlOverlay.style.position = "absolute";
				htmlOverlay.style.top = canvasPosition.y - htmlOverlay.clientHeight + "px";
				htmlOverlay.style.left = canvasPosition.x - htmlOverlay.clientWidth / 2 + "px";
			}
		};
		if(closeselector){
			const closepop=htmlOverlay.querySelector(closeselector);
			if(closepop){
				const scope=this;
				closepop.onclick = function () {
					GlobalState.getInstance().viewer.scene.postUpdate.removeEventListener(animateEvent);
					GlobalState.getInstance().viewer.cesiumWidget.container.removeChild(htmlOverlay);
					delete scope.pops[htmlOverlay.id];
				};
			}
		}


		GlobalState.getInstance().viewer.scene.postUpdate.addEventListener(animateEvent);

		this.pops[htmlOverlay.id]={
			updlistener:animateEvent,
			htmldiv:htmlOverlay,
		}
		return htmlOverlay.id;
	}

	RemovePopUp(id){
		if(id==null) return;
		if(!this.pops[id]) return;
		GlobalState.getInstance().viewer.scene.postUpdate.removeEventListener(this.pops[id].updlistener);
		GlobalState.getInstance().viewer.cesiumWidget.container.removeChild(this.pops[id].htmldiv);
		delete this.pops[id];
	}
}




