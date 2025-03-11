/**
 * 两个echarts使用的，分别为vw和vh的输入值，输出px
 * @param {*} res
 * @returns
 */
export function fontSize_VW(res) {
	let clientWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	if (!clientWidth) return;
	return Math.round(res * (clientWidth / 100));
}

export function fontSize_VH(res) {
	let clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	if (!clientHeight) return;
	return Math.round(res * (clientHeight / 100));
}
