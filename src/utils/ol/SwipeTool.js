class SwipeTool {
	constructor(mapClass) {
		this.mapClass = mapClass;
		this.olMap = mapClass.olMap;
		this.layers = [];
		this.init();
	}
	init() {
		let self = this;
		let htmlEle = document.createElement("div");
		htmlEle.id = "SwipeContainer";
		htmlEle.style.display = "none";
		htmlEle.innerHTML = `
		<div class="bg">
			<div class="line"></div>
			<div class="handle"></div>
		</div>`;
		document.body.append(htmlEle);
		let swipe = htmlEle.querySelector(".bg");
		let obj = {};
		swipe.onmousedown = function (event) {
			let e = event || window.event;
			// 鼠标点击元素那一刻相对于元素左侧边框的距离=点击时的位置相对于浏览器最左边的距离-物体左边框相对于浏览器最左边的距离
			obj.diffX = e.clientX - this.offsetLeft;
			document.onmousemove = function (event) {
				let e = event || window.event;
				let moveX = e.clientX - obj.diffX;
				if (moveX < 0) {
					moveX = 0;
				} else if (moveX > window.innerWidth - swipe.offsetWidth) {
					moveX = window.innerWidth - swipe.offsetWidth;
				}
				swipe.style.left = moveX + "px";

				//重新渲染图层
				self.olMap.render();
			};
			document.onmouseup = function () {
				this.onmousemove = null;
				this.onmouseup = null;
			};
		};
	}
	// 添加卷帘图层
	add(type, layerOptions) {
		let self = this;
		layerOptions.displayInLayerSwitcher = false;
		let layer = this.mapClass.loadBase(layerOptions);
		layer.zIndex = 999;
		layer.on("prerender", function (event) {
			let container = document.getElementById("SwipeContainer");
			container.style.display = "block";
			let swipe = container.querySelector(".bg");
			let ctx = event.context;
			//计算图层在canvas画布上需要显示的范围
			let mapSize = self.olMap.getSize();
			let height = event.context.canvas.height;
			let width = event.context.canvas.width;
			let swipeWidth = (swipe.offsetLeft * width) / mapSize[0];
			let tl, tr, bl, br;
			if (type == "left") {
				tl = [0, 0];
				tr = [swipeWidth, 0];
				bl = [0, height];
				br = [swipeWidth, height];
			} else {
				tl = [swipeWidth, 0];
				tr = [width, 0];
				bl = [swipeWidth, height];
				br = [width, height];
			}
			ctx.save();
			//绘制裁剪路径
			ctx.beginPath();
			ctx.moveTo(tl[0], tl[1]);
			ctx.lineTo(bl[0], bl[1]);
			ctx.lineTo(br[0], br[1]);
			ctx.lineTo(tr[0], tr[1]);
			ctx.closePath();
			//裁剪，裁剪路径以外的部分不会绘制在canvas上下文中
			ctx.clip();
		});
		layer.on("postrender", function (event) {
			let ctx = event.context;
			ctx.restore();
		});
		this.olMap.addLayer(layer);
		this.layers.push(layer);
	}
	// 清除
	stop() {
		this.layers.some((item) => {
			this.olMap.removeLayer(item);
		});
		let container = document.getElementById("SwipeContainer");
		container.style.display = "none";
	}
}
export default SwipeTool;
