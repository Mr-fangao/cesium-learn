/**
 * 封装rgbaTo16color功能函数
 * 功能: 把rgba颜色进行转换为16进制颜色
 */
export function rgbaTo16color(color) {
	let val = color
		.replace(/rgba?\(/, "")
		.replace(/\)/, "")
		.replace(/[\s+]/g, "")
		.split(",");
	let a = parseFloat(val[3] || 1),
		r = Math.floor(a * parseInt(val[0]) + (1 - a) * 255),
		g = Math.floor(a * parseInt(val[1]) + (1 - a) * 255),
		b = Math.floor(a * parseInt(val[2]) + (1 - a) * 255);
	return "#" + ("0" + r.toString(16)).slice(-2) + ("0" + g.toString(16)).slice(-2) + ("0" + b.toString(16)).slice(-2);
}
// 绘制无人机血槽 url1:blood.png
export function drawAirBlood(url1, num = 0) {
	return new Promise((resolve, reject) => {
		loadImage(url1).then((res) => {
			let img1 = res;
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = img1.width;
			canvas.height = img1.height;
			ctx.drawImage(img1, 0, 0);
			let fillColor = "#69d45c";
			if (num <= 30 && num >= 0) {
				fillColor = "#DC143C";
			} else if (num > 30 && num < 60) {
				fillColor = "#FFA500";
			} else {
				fillColor = "#69d45c";
			}
			ctx.fillStyle = fillColor;
			let sx = 45;
			let sy = 6;
			let sh = 12;
			let len = (num / 100) * 230;
			ctx.fillRect(sx, sy, len, 28);
			ctx.lineWidth = 1;
			for (let i = 1; i < len / 11.5; i++) {
				if (i % 5 == 0 && i >= 5) {
					sh = 28;
				} else {
					sh = 12;
				}
				ctx.beginPath();
				ctx.moveTo(sx + 10.5, sy);
				ctx.lineTo(sx + 10.5, sy + sh);
				ctx.stroke();
				sx += 11.5;
			}
			canvasToImage(canvas).then((res) => {
				resolve(res);
			});
		});
	});
}
/**
 * @Author: dongnan
 * @Description: 画两个样式的文本canvas
 * @Date: 2021-02-08 23:15:33
 * @param {string} imgUrl 图片地址
 * @param {Object} options
 * @param {string} options.text 第一个文字
 * @param {Object} options.fontOptions 第一个文字样式  {font:"25px sans-serif",fillColor:"White",strokeColor:"#3e59a9"}
 * @param {Array} options.padding 第一个文字间距 [上右下左]
 * @param {string} options.text2 第二个文字
 * @param {Object} options.fontOptions2 第二个文字样式  {font:"40px sans-serif",fillColor:"red",strokeColor:"#3e59a9"}
 * @param {Array} options.padding2 第二个文字间距 [上右下左]
 * @return {Object} result
 * @return {HTMLCanvasElement} result.canvas 画布对象
 * @return {HTMLCanvasElement} result.scale  画布宽高比(height/width)
 */
export function drawDoubleTextCanvas(imgUrl, options) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = imgUrl;
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let text1 = "";
			let text2 = "";
			let padding1 = [20, 20, 20, 20];
			let padding2 = [20, 20, 20, 20];
			let font1 = "25px sans-serif";
			let font2 = "40px sans-serif";
			let fillStyle1 = "White";
			let fillStyle2 = "red";
			let strokeStyle1 = "#3e59a9";
			let strokeStyle2 = "#3e59a9";
			let fontSize1 = 25;
			let fontSize2 = 40;
			let textWidth = 0;
			let canvasWidth = 0;
			let canvasHeight = 0;
			if (options) {
				text1 = options?.text ?? text1;
				text2 = options?.text2 ?? text2;
				padding1 = options?.padding ?? padding1;
				padding2 = options?.padding2 ?? padding2;
				// 第一个文字样式
				if (options.fontOptions) {
					font1 = options.fontOptions?.font ?? font1;
					fillStyle1 = options.fontOptions?.fillColor ?? fillStyle1;
					strokeStyle1 = options.fontOptions?.strokeColor ?? strokeStyle1;
				}
				// 第二个文字样式
				if (options.fontOptions2) {
					font2 = options.fontOptions2?.font ?? font2;
					fillStyle2 = options.fontOptions2?.fillColor ?? fillStyle2;
					strokeStyle2 = options.fontOptions2?.strokeColor ?? strokeStyle2;
				}
			}
			// 确认字的大小
			let fontArray1 = font1.split(" ");
			let fontArray2 = font2.split(" ");
			fontArray1.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize1 = parseFloat(item);
					return;
				}
			});
			fontArray2.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize2 = parseFloat(item);
					return;
				}
			});
			// 根据字的个数判断
			textWidth = fontSize1 * text1.trim().length + fontSize2 * text2.trim().length;
			// 设置padding[上,右,下,左]
			canvasWidth = padding1[1] + padding1[3] + textWidth + padding2[1] + padding2[3];
			canvasHeight =
				padding1[0] + fontSize1 + padding1[2] > padding2[0] + fontSize2 + padding2[2]
					? padding1[0] + fontSize1 + padding1[2]
					: padding2[0] + fontSize2 + padding2[2];
			const canvasScale = canvasHeight / canvasWidth;
			// 设置canvas大小
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			// 绘制图片 100%填充
			let imgWidthScale = canvasWidth / img.width;
			let imgHeightScale = canvasHeight / img.height;
			context.scale(imgWidthScale, imgHeightScale);
			context.drawImage(img, 0, 0);
			context.scale(1 / imgWidthScale, 1 / imgHeightScale);
			document.fonts.load(font1);
			document.fonts.load(font2);
			document.fonts.ready.then(() => {
				// 绘制文字1
				context.lineWidth = 4;
				context.font = font1;
				context.strokeStyle = strokeStyle1;
				context.fillStyle = fillStyle1;
				context.strokeText(text1.trim(), padding1[3], padding1[0] + fontSize1 / 1.5);
				context.fillText(text1.trim(), padding1[3], padding1[0] + fontSize1 / 1.5);
				// 绘制文字2
				let textLength1 = text1.trim().length * fontSize1 + padding1[3] + padding1[1];
				context.lineWidth = 4;
				context.font = font2;
				context.strokeStyle = strokeStyle2;
				context.fillStyle = fillStyle2;
				context.strokeText(text2.trim(), textLength1 + padding2[3], padding2[0] + fontSize2 / 1.5);
				context.fillText(text2.trim(), textLength1 + padding2[3], padding2[0] + fontSize2 / 1.5);
				resolve({
					canvas: canvas,
					scale: canvasScale,
				});
			});
		};
	});
}
/**
 * @Author: dongnan
 * @Description: 画单样式文本canvas 内嵌型
 * @Date: 2021-02-08 23:15:33
 */
export function drawSingleTextCanvas(url, textOptions) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let text = "";
			let padding = [20, 20, 20, 20];
			let font = "30px sans-serif";
			let fillStyle = "White";
			let strokeStyle = "#3e59a9";
			let fontSize = 30;
			let textWidth = 0;
			let textHeight = 0;
			let canvasWidth = 0;
			let canvasHeight = 0;
			if (textOptions) {
				text = textOptions.text ?? text;
				padding = textOptions?.padding ?? padding;
				if (textOptions.fontOptions) {
					font = textOptions.fontOptions?.font ?? font;
					fillStyle = textOptions.fontOptions?.fillColor ?? fillStyle;
					strokeStyle = textOptions.fontOptions?.strokeColor ?? strokeStyle;
				}
			}
			// 确认字的大小
			let fontArray = font.split(" ");
			fontArray.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize = parseFloat(item);
					return;
				}
			});
			// 根据字的个数判断
			textWidth = fontSize * text.trim().length;
			textHeight = fontSize;
			// 设置padding[上,右,下,左]
			canvasWidth = padding[1] + padding[3] + textWidth;
			canvasHeight = padding[0] + padding[2] + textHeight;
			const canvasScale = canvasHeight / canvasWidth;
			// 设置canvas大小
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			// 绘制图片 100%填充
			let imgWidthScale = canvasWidth / img.width;
			let imgHeightScale = canvasHeight / img.height;
			context.scale(imgWidthScale, imgHeightScale);
			context.drawImage(img, 0, 0);
			// 绘制文字
			context.scale(1 / imgWidthScale, 1 / imgHeightScale);
			context.lineWidth = 4;
			document.fonts.load(font);
			document.fonts.ready.then(() => {
				context.font = font;
				context.strokeStyle = strokeStyle;
				context.fillStyle = fillStyle;
				context.strokeText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
				context.fillText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
				resolve({
					canvas: canvas,
					scale: canvasScale,
				});
			});
		};
	});
}
/**
 * @Author: dongnan
 * @Description: 画单样式文本canvas 内嵌型
 * @Date: 2021-02-08 23:15:33
 */
export function drawTwoTextCanvas(url, width, height, textOptions, textOptions2) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let text = "";
			let padding = [20, 20, 20, 20];
			let font = "30px sans-serif";
			let fillStyle = "White";
			let strokeStyle = "#3e59a9";
			let text2 = "";
			let font2 = "30px sans-serif";
			let padding2 = [20, 20, 20, 20];
			let fontSize2 = "30px sans-serif";
			let fillStyle2 = "White";
			let strokeStyle2 = "#3e59a9";
			let fontSize = 30;
			let textWidth = 0;
			let textHeight = 0;
			let canvasWidth = width;
			let canvasHeight = height;
			let left = 0;
			let top = 0;
			let left2 = 0;
			let top2 = 0;
			if (textOptions) {
				text = textOptions.text ?? text;
				left = textOptions.left ?? left;
				top = textOptions.top ?? top;
				if (textOptions.fontOptions) {
					font = textOptions.fontOptions?.font ?? font;
					fillStyle = textOptions.fontOptions?.fillColor ?? fillStyle;
					strokeStyle = textOptions.fontOptions?.strokeColor ?? strokeStyle;
				}
			}
			if (textOptions2) {
				text2 = textOptions2.text ?? text;
				left2 = textOptions2.left ?? left2;
				top2 = textOptions2.top ?? top2;
				if (textOptions2.fontOptions) {
					font2 = textOptions2.fontOptions?.font ?? font;
					fillStyle2 = textOptions2.fontOptions?.fillColor ?? fillStyle;
					strokeStyle2 = textOptions2.fontOptions?.strokeColor ?? strokeStyle;
				}
			}
			const canvasScale = canvasHeight / canvasWidth;
			// 设置canvas大小
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			// 绘制图片 100%填充
			let imgWidthScale = canvasWidth / img.width;
			let imgHeightScale = canvasHeight / img.height;
			context.scale(1, imgHeightScale);
			context.drawImage(img, (canvasWidth - img.width) / 2, 0);
			// 绘制文字
			context.scale(1, 1 / imgHeightScale);
			context.lineWidth = 4;
			document.fonts.load(font);
			document.fonts.load(font2);
			document.fonts.ready.then(() => {
				context.textAlign = "center";
				context.font = font;
				context.strokeStyle = strokeStyle;
				context.fillStyle = fillStyle;
				context.strokeText(text.trim(), width / 2, top);
				context.fillText(text.trim(), width / 2, top);
				context.font = font2;
				context.strokeStyle = strokeStyle2;
				context.fillStyle = fillStyle2;
				context.strokeText(text2.trim(), width / 2, top2);
				context.fillText(text2.trim(), width / 2, top2);
				resolve({
					canvas: canvas,
					scale: canvasScale,
				});
			});
		};
	});
}
/**
 * @Author: dongnan
 * @Description: 绘制文本canvas
 * @Date: 2021-09-11 20:44:54
 */
export function drawTextCanvas(textOptions) {
	return new Promise((resolve, reject) => {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let font = "28px sans-serif";
		let fillStyle = "#4fa9cb";
		let strokeStyle = "#4fa9cb";
		let fontSize = 28;
		let text = "";
		if (textOptions) {
			text = textOptions?.text ?? text;
			if (textOptions.fontOptions) {
				font = textOptions.fontOptions?.font ?? font;
				fillStyle = textOptions.fontOptions?.fillColor ?? fillStyle;
				strokeStyle = textOptions.fontOptions?.strokeColor ?? strokeStyle;
			}
		}
		// 确认字的大小
		let fontArray = font.split(" ");
		fontArray.some((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize = parseFloat(item);
				return true;
			}
		});
		canvas.width = fontSize * (text.length + 2);
		canvas.height = fontSize + 10;
		context.lineWidth = 2;
		document.fonts.load(font);
		document.fonts.ready.then(() => {
			context.font = font;
			context.fillStyle = fillStyle;
			context.strokeStyle = strokeStyle;
			context.textAlign = "center";
			context.fillText(text, canvas.width / 2, fontSize);
			context.strokeText(text, canvas.width / 2, fontSize);
			resolve(canvas);
		});
	});
}
// 绘制图片
export function drawImage(image, width, height) {
	return new Promise((resolve) => {
		let img = new Image();
		img.src = image;
		img.onload = function () {
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			canvas.width = width;
			canvas.height = height;
			let imgWidthScale = canvas.width / img.width;
			let imgHeightScale = canvas.height / img.height;
			context.scale(imgWidthScale, imgHeightScale);
			context.drawImage(img, 0, 0);
			resolve(canvas);
		};
	});
}
/**
 * @Author: dongnan
 * @Description: canvas转image
 * @Date: 2022-11-25 11:08:57
 * @param {HTMLCanvasElement} canvas 画布
 * @return {HTMLImageElement} image 图片
 */
export function canvasToImage(canvas) {
	return new Promise((resolve, reject) => {
		//新Image对象，可以理解为DOM
		let image = new Image();
		// canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
		// 指定格式 PNG
		image.src = canvas.toDataURL("image/png");
		image.onload = function () {
			resolve(image);
		};
	});
}
// 异步加载图片
function loadImage(url) {
	return new Promise((resolve) => {
		let img = new Image();
		img.src = url;
		img.onload = function () {
			resolve(img);
		};
	});
}
// 缩小image
function scaleImage(url, sx, sy) {
	return new Promise((resolve) => {
		let img = new Image();
		img.src = url;
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			canvas.width = img.width * sx;
			canvas.height = img.height * sy;
			ctx.scale(sx, sy);
			ctx.drawImage(img, 0, 0);
			// canvas 转为img
			let image = new Image();
			// canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
			// 指定格式 PNG
			image.src = canvas.toDataURL("image/png");
			image.onload = function () {
				resolve(image);
			};
		};
	});
}
