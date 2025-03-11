function getcanvas(t_length) {
	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");
	let length = t_length;
	canvas.width = length * 17;
	canvas.height = 30;
	let x = 0;
	let y = 0;
	let w = canvas.width;
	let h = canvas.height;
	let r = 6;
	// 缩放
	context.scale(1, 1);
	context.fillStyle = "rgba(82, 87, 122,0.8)";
	// 绘制圆角矩形
	context.beginPath();
	context.moveTo(x + r, y);
	context.arcTo(x + w, y, x + w, y + h, r);
	context.arcTo(x + w, y + h, x, y + h, r);
	context.arcTo(x, y + h, x, y, r);
	context.arcTo(x, y, x + w, y, r);
	// 设置阴影
	context.shadowColor = "rgba(0, 0, 0, 0.2)"; // 颜色
	context.shadowBlur = 2; // 模糊尺寸
	context.shadowOffsetX = 2; // 阴影Y轴偏移
	context.shadowOffsetY = 2; // 阴影X轴偏移
	context.closePath();
	context.fill();
	return {
		canvas: canvas,
		w: w,
		h: h,
	};
}
