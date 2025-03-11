// 全局参数挂载
import modal from "./plugins/modal";
import { handleTree, handleSortTree, resetForm, parseTime, addDateRange } from "./plugins/ruoyi";
import * as components from "@element-plus/icons-vue";
import has from "./directive/has";
import wave from "./directive/wave";
import drag from "./directive/drag";
import getAssets from "./tools/getAssets";
import * as echarts from "echarts";
import { fontSize_VW, fontSize_VH } from "./tools/windowSize";

export default function installPlugins(app) {
	// 模态框对象
	app.config.globalProperties.$modal = modal;
	// 构造树形结构
	app.config.globalProperties.handleTree = handleTree;
	// 构造树形结构
	app.config.globalProperties.handleSortTree = handleSortTree;
	// 重置form表单
	app.config.globalProperties.resetForm = resetForm;
	// 解析时间
	app.config.globalProperties.parseTime = parseTime;
	// 添加日期范围
	app.config.globalProperties.addDateRange = addDateRange;
	// 获取资源
	app.config.globalProperties.$getAssets = getAssets;
	// 权限控制指令
	app.directive("has", has);
	// 点击水波纹指令
	app.directive("wave", wave);
	// 全局的拖动事件
	app.directive("drag", drag);
	// echarts
	app.config.globalProperties.$echarts = echarts;
	// 自适应
	app.config.globalProperties.vw2px = fontSize_VW;
	app.config.globalProperties.vh2px = fontSize_VH; // 根据高度931情况下的 实际poi高度 实际poi缩放  来返回新的缩放大小
	window.poiScale = poiScale;
}
// poi自适应
function poiScale(height, scale) {
	let vHeight = height / 931;
	let curHeight = vHeight * window.innerHeight;
	let newScale = (curHeight / height) * scale;
	return newScale;
}
