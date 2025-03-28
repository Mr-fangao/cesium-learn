<script setup>
	import { GlobalState } from "@/buss/GlobalState";
	import MeasureTool from "./MeasureTool.js";
	import useLoginStore from "@/store/login.js";
	import { storeToRefs } from 'pinia';
	const { proxy } = getCurrentInstance();
	const loginStore = useLoginStore();
	const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
	const changeRate = ref(0);
	const activeStatus = ref(false);
	const activeItem = ref("");
	const props = defineProps({
		right: {
			type: String,
			default: "37vh",
		},
	});
	let measureTool;
	// 工具点击
	function toolClick(key) {
		activeItem.value = key;
		switch (key) {
			case "point":
				if (!measureTool) {
					measureTool = new MeasureTool({
						viewer: GlobalState.getInstance().viewer,
					});
				}
				measureTool.drawPoint(() => {
					activeItem.value = "";
				});
				break;
			case "line":
				if (!measureTool) {
					measureTool = new MeasureTool({
						viewer: GlobalState.getInstance().viewer,
					});
				}
				measureTool.drawLine(() => {
					activeItem.value = "";
				});
				break;
			case "area":
				if (!measureTool) {
					measureTool = new MeasureTool({
						viewer: GlobalState.getInstance().viewer,
					});
				}
				measureTool.drawPolygon(() => {
					activeItem.value = "";
				});
				break;
			case "height":
				if (!measureTool) {
					measureTool = new MeasureTool({
						viewer: GlobalState.getInstance().viewer,
					});
				}
				measureTool.drawHeight(() => {
					activeItem.value = "";
				});
				break;
			case "clear":
				if (measureTool) {
					measureTool.clear();
				}
				break;
			default:
				break;
		}
	}
	// 关闭
	function hide() {
		activeItem.value = "";
		if (measureTool) {
			measureTool.clear();
		}
		changeRate.value = 0;
	}
	// 展示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		let element = proxy.$refs.MeasureToolRefs;
		if (changeRate.value == 0) {
			element.style.setProperty("--right", parseInt(props.right) + 5 + "vh");
		}
		if (leftCollapse.value) {
			element.style.setProperty("--moveRate", "-35vh");
		} else {
			element.style.setProperty("--moveRate", "35vh");
		}
	}
	// 激活的类
	const activeClass = computed(() => {
		let text = "";
		if (changeRate.value > 0) {
			if (activeStatus.value) {
				text = leftCollapse.value ? "backOrigin" : "leaveOrigin";
			} else {
				text = leftCollapse.value ? "leaveOrigin" : "backOrigin";
			}
		}
		return text;
	});
	watch(
		() => leftCollapse.value,
		(newValue, oldValue) => {
			changeRate.value++;
		},
	);
	defineExpose({
		hide,
		show,
	});
</script>
<template>
	<div class="MeasureTool" ref="MeasureToolRefs">
		<div :class="['ButtonContent', activeClass]">
			<div class="buttonitem" @click="toolClick('point')" :class="[activeItem == 'point' ? 'active' : '']">
				<img src="./assets/point.svg" alt="" />
				<div class="titletext">坐标定位</div>
			</div>
			<div class="buttonitem" @click="toolClick('line')" :class="[activeItem == 'line' ? 'active' : '']">
				<img src="./assets/line.svg" alt="" />
				<div class="titletext">距离测量</div>
			</div>
			<div class="buttonitem" @click="toolClick('area')" :class="[activeItem == 'area' ? 'active' : '']">
				<img src="./assets/area.svg" alt="" />
				<div class="titletext">面积测量</div>
			</div>
			<div class="buttonitem" @click="toolClick('height')" :class="[activeItem == 'height' ? 'active' : '']">
				<img src="./assets/height.svg" alt="" />
				<div class="titletext">高度测量</div>
			</div>
			<div class="buttonitem" @click="toolClick('clear')" :class="[activeItem == 'clear' ? 'active' : '']">
				<img src="./assets/clear.svg" alt="" />
				<div class="titletext">清除</div>
			</div>
			<!-- <img src="./assets/point.svg" alt="" @click="toolClick('point')" :class="[activeItem == 'point' ? 'active' : '']" />
			<img src="./assets/line.svg" alt="" @click="toolClick('line')" :class="[activeItem == 'line' ? 'active' : '']" />
			<img src="./assets/area.svg" alt="" @click="toolClick('area')" :class="[activeItem == 'area' ? 'active' : '']" />
			<img src="./assets/height.svg" alt="" @click="toolClick('height')" :class="[activeItem == 'height' ? 'active' : '']" />
			<img src="./assets/clear.svg" alt="" @click="toolClick('clear')" :class="[activeItem == 'clear' ? 'active' : '']" /> -->
		</div>
		<!-- <div class="PointPopup">
			<p class="row">
				<span class="leftLabel"> 经度： </span>
				<span class="rightContent"> 118.256414 </span>
			</p>
			<p class="row">
				<span class="leftLabel"> 经度： </span>
				<span class="rightContent"> 118.256414 </span>
			</p>
			<p class="row">
				<span class="leftLabel"> 高度： </span>
				<span class="rightContent"> 0.56米 <img src="./assets/copy.png" alt="" class="copy" /> </span>
			</p>
		</div> -->
	</div>
</template>
<style lang="less">
	.PointPopup {
		position: absolute;
		pointer-events: none;
		// right: 55vh;
		// top: 18.1vh;
		background: #07152fcc;
		width: 18vh;
		border-radius: 5px;
		padding-top: 1.2vh;
		.row {
			height: 2vh;
			line-height: 2vh;
			text-align: left;
			padding-left: 2.4vh;
			span {
				font-size: 1.4vh;
				font-family: puhui_Regular_55;
				color: #fff;
				.copy {
					width: 2vh;
					height: 2vh;
					position: absolute;
					right: 2vh;
					cursor: pointer;
					pointer-events: auto;
				}
			}
		}
	}
</style>
<style lang="less" scoped>
	.MeasureTool {
		@keyframes backOrigin {
			0% {
				transform: translateX(var(--moveRate, 0));
			}
			100% {
				transform: translateX(0);
			}
		}
		@keyframes leaveOrigin {
			0% {
				transform: translateX(0);
			}
			100% {
				transform: translateX(var(--moveRate, 0));
			}
		}
		.backOrigin {
			animation: backOrigin 1s ease forwards;
		}
		.leaveOrigin {
			animation: leaveOrigin 1s ease forwards;
		}
	}
	.ButtonContent {
		// position: absolute;
		// // right: 42vh;
		// right: var(--right, 42vh);
		// top: 10.8vh;
		// height: 3.2vh;
		// background: #07152fcc;
		// border-radius: 4px;
		// font-size: 1.7vh;
		// color: #fff;
		// line-height: 3.2vh;
		// overflow-y: hidden;
		position: absolute;
		right: var(--right, 42vh);
		top: 10.8vh;
		height: auto;
		width: 10vh;
		background: #07152fcc;
		border-radius: 4px;
		font-size: 1.7vh;
		color: #fff;
		line-height: 3.2vh;
		overflow-y: hidden;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		padding: 0.5vh 0;
		.buttonitem{
			height: 3vh;
			width: 100%;
			display: flex;
			flex-direction: row;
			align-items: center;
			.titletext{
				font-size: 1.4vh;
				color: #fff;
				line-height: 3.2vh;
				width: 8vh;
			}
			img{
				width: 1.6vh;
				height: 1.6vh;
				display: inline-block;
				margin: 0 0.7vh;
				cursor: pointer;
			}
			&.active {
				// color: #2381ca;
				.titletext{
					color: #2381ca;
				}
				img {
					transform: translateY(-800px);
					filter: drop-shadow(#2381ca 0 800px);
				}
			}
		}
		.divideLine {
			background: #5c6671;
			width: 0.1vh;
			height: 1.48vh;
			display: inline-block;
			top: 0.3vh;
			position: relative;
		}
		img {
			width: 1.6vh;
			height: 1.6vh;
			display: inline-block;
			margin: 0 0.7vh;
			cursor: pointer;
			&.active {
				transform: translateY(-800px);
				filter: drop-shadow(#2381ca 0 800px);
			}
		}
	}
</style>
