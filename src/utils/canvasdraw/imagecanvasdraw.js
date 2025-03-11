/**
 * Created by wqy
 * Date 2023/4/7 14:54
 * Description
 */
/**
	* 绘制图片
	* @param image1
	* @param image2
	* @param left
	* @param top
	* @returns {Promise<unknown>}
*/
export function drawImageCanvas(image1, image2, left = 0, top = 0, scale = 1) {
	function loadImage(img) {
		return new Promise((resolve) => {
			img.onload = function () {
				resolve(img);
			};
		});
	}
	return new Promise((resolve, reject) => {
		let img1 = new Image();
		let img2 = new Image();
		img1.src = image1;
		img2.src = image2;
		Promise.all([loadImage(img1), loadImage(img2)]).then((images) => {
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			canvas.width = images[1].width;
			canvas.height = images[1].height;
			// 在这里可以使用context绘制图像
			context.drawImage(images[1], 0, 0);
			context.drawImage(images[0], left, top, images[0].width * scale, images[0].height * scale);
			resolve(canvas);
		});
	});
}

export function drawImageCanvasScale(image1, image2, left = 0, top = 0, s1 = 1, s2 = 2) {
	function loadImage(img) {
		return new Promise((resolve) => {
			img.onload = function () {
				resolve(img);
			};
		});
	}
	return new Promise((resolve, reject) => {
		let img1 = new Image();
		let img2 = new Image();
		img1.src = image1;
		img2.src = image2;
		Promise.all([loadImage(img1), loadImage(img2)]).then((images) => {
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			canvas.width = images[1].width * s1;
			canvas.height = images[1].height * s1;
			// 在这里可以使用context绘制图像
			context.drawImage(images[1], 0, 0, images[1].width * s1, images[1].height * s1);
			context.drawImage(images[0], left, top, images[0].width * s2, images[0].height * s2);
			resolve(canvas);
		});
	});
}
