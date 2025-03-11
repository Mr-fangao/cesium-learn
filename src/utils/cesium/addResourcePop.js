import Bus from "@/buss/eventBus";
export function addResourceWellPop(viewer, option) {
	if (option.selector == undefined) return;
	let htmlOverlay = document.createElement("div");
	htmlOverlay.innerHTML = option.html;
	viewer.cesiumWidget.container.append(htmlOverlay);
	//dom更新后查找id,并赋属性
	if (option.eventtitle != null) {
		let eventtitle = document.getElementById("OccurrenceLocale");
		let attr = document.createAttribute("title");
		attr.value = option.eventtitle;
		eventtitle.setAttributeNode(attr);
	}
	let animateEvent = function (scene, time) {
		let position = Cesium.Cartesian3.fromDegrees(
			parseFloat(option.position[0]),
			parseFloat(option.position[1]),
			parseFloat(option.position[2]),
		);
		let canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position, new Cesium.Cartesian2());
		let container = htmlOverlay.querySelector(option.selector);
		if (Cesium.defined(canvasPosition)) {
			htmlOverlay.style.position = "absolute";
			htmlOverlay.style.top = canvasPosition.y - container.clientHeight + option.offset[1] + "px";
			htmlOverlay.style.left = canvasPosition.x - container.clientWidth / 2 + option.offset[0] + "px";
		}
	};

	//这里注释掉了，因为不是所有传入的html都有这个类的元素，htmlOverlay.querySelector(".closeResourcePop")是空，会报错，
	// 且这里还有东西没有删除
	const closepop = htmlOverlay.querySelector(".closeResourcePop");
	if (closepop) {
		closepop.onclick = function () {
			viewer.scene.postUpdate.removeEventListener(animateEvent);
			viewer.cesiumWidget.container.removeChild(htmlOverlay);
			Bus.VM.$emit(Bus.SignalType.CLOSEPOPUP, animateEvent);
		};
	}
	viewer.scene.postUpdate.addEventListener(animateEvent);
	return { event: animateEvent, div: htmlOverlay };
}

export function removePop(viewer, eventList, selector) {
	if (eventList == null || selector == null) return;

	eventList.some((item) => {
		viewer.scene.postUpdate.removeEventListener(item);
	});
	eventList.splice(0, eventList.length);

	let popups = viewer.cesiumWidget.container.querySelectorAll(selector);
	for (let pop of popups) {
		viewer.cesiumWidget.container.removeChild(pop.parentElement);
	}
}
