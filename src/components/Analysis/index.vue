<script setup>
import visualfield from "./components/VisualFieldAnalysis/index.vue";
import skyline from "./components/SkyLineAnalysis/index.vue";
import sectiona from "./components/SectionAnalysis/index.vue"; // <section></section>本身就是html的标签
import limitheight from "./components/LimitHeightAnalysis/index.vue";
import useLoginStore from "@/store/login.js";
const { proxy } = getCurrentInstance();
import { storeToRefs } from 'pinia';
const loginStore = useLoginStore();
const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
const changeRate = ref(0);
const activeStatus = ref(false);
const props = defineProps({
	top: {
		type: String,
		default: "22vh",
	},
	left: {
		type: String,
		default: "37vh",
	},
});
const activeKey = ref();
const beforeKey = ref();
// 菜单激活按钮
function toolClick(key) {
	activeKey.value = key;
	switch (beforeKey.value) {
		case "view":
			proxy.$refs.viewRef1.hide();
			break;
		case "sky":
			proxy.$refs.skyRef1.hide();
			break;
		case "sun":
			proxy.$refs.sunRef1.hide();
			break;
		case "limit":
			proxy.$refs.limitRef1.hide();
			break;
		case "land":
			proxy.$refs.landRef1.hide();
			break;
		default:
			break;
	}
	if (beforeKey.value && beforeKey.value == activeKey.value) {
		activeKey.value = null;
		beforeKey.value = null;
		return;
	}
	switch (activeKey.value) {
		case "view":
			proxy.$refs.viewRef1.show();
			break;
		case "sky":
			proxy.$refs.skyRef1.show();
			break;
		case "sun":
			proxy.$refs.sunRef1.show();
			break;
		case "limit":
			proxy.$refs.limitRef1.show();
			break;
		case "land":
			proxy.$refs.landRef1.show();
		default:
			break;
	}
	beforeKey.value = key;
}
// 关闭
function hide() {
	switch (activeKey.value) {
		case "view":
			proxy.$refs.viewRef1.hide();
			break;
		case "sky":
			proxy.$refs.skyRef1.hide();
			break;
		case "sun":
			proxy.$refs.sunRef1.hide();
			break;
		case "limit":
			proxy.$refs.limitRef1.hide();
			break;
		case "land":
			proxy.$refs.landRef1.hide();
			break;
		default:
			break;
	}
	activeKey.value = null;
}
// 关闭分析
function close() {
	activeKey.value = null;
	beforeKey.value = null;
}
// 展示
function show() {
	changeRate.value = 0;
	activeStatus.value = leftCollapse.value;
	let element = proxy.$refs.MapAnalysisRefs;
	if (changeRate.value == 0) {
		element.style.setProperty("--left", parseInt(props.left) + 5 + "vh");
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
	<div class="MapAnalysis" ref="MapAnalysisRefs">
		<div :class="['ButtonContent', activeClass]">
			<div class="buttonitem" @click="toolClick('view')" :class="[activeKey == 'view' ? 'active' : '']">
				<img src="./assets/view.svg" alt="" />
				<div class="titletext">视域分析</div>
			</div>
			<div class="buttonitem" @click="toolClick('sky')" :class="[activeKey == 'sky' ? 'active' : '']">
				<img src="./assets/sky.svg" alt="" />
				<div class="titletext">天际线分析</div>
			</div>
			<div class="buttonitem" @click="toolClick('limit')" :class="[activeKey == 'limit' ? 'active' : '']">
				<img src="./assets/limit.svg" alt="" />
				<div class="titletext">限高分析</div>
			</div>
			<div class="buttonitem" @click="toolClick('land')" :class="[activeKey == 'land' ? 'active' : '']">
				<img src="./assets/land.svg" alt="" />
				<div class="titletext">地形剖面</div>
			</div>
			<!-- <img src="./assets/view.svg" alt="" @click="toolClick('view')" :class="[activeKey == 'view' ? 'active' : '']" />
			<img src="./assets/sky.svg" alt="" @click="toolClick('sky')" :class="[activeKey == 'sky' ? 'active' : '']" />
			<img src="./assets/limit.svg" alt="" @click="toolClick('limit')" :class="[activeKey == 'limit' ? 'active' : '']" />
			<img src="./assets/land.svg" alt="" @click="toolClick('land')" :class="[activeKey == 'land' ? 'active' : '']" /> -->
		</div>
		<visualfield v-show="activeKey == 'view'" @close="close" ref="viewRef1" :top="props.top" :left="props.left">
		</visualfield>
		<skyline v-show="activeKey == 'sky'" @close="close" ref="skyRef1" :top="props.top" :left="props.left">
		</skyline>
		<!--<sunlight v-show="activeKey == 'sun'" @close="close" ref="sunRef1" :top="props.top" :left="props.left"></sunlight>-->
		<limitheight v-show="activeKey == 'limit'" @close="close" ref="limitRef1" :top="props.top" :left="props.left">
		</limitheight>
		<sectiona v-show="activeKey == 'land'" @close="close" ref="landRef1" :top="props.top" :left="props.left">
		</sectiona>
	</div>
</template>
<style lang="less" scoped>
.MapAnalysis {
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
	z-index: 999;
	position: absolute;
	left: 2vh;
	top: 4.5vh;
	height: auto;
	width: 10.5vh;
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

	.buttonitem {
		height: 3vh;
		width: 100%;
		display: flex;
		flex-direction: row;
		align-items: center;

		.titletext {
			font-size: 1.4vh;
			color: #fff;
			line-height: 3.2vh;
			width: 8vh;
		}

		img {
			width: 1.6vh;
			height: 1.6vh;
			display: inline-block;
			margin: 0 0.7vh;
			cursor: pointer;
		}

		&.active {

			// color: #2381ca;
			.titletext {
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
