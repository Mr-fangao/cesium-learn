<script setup>
	import popdialog from "../dragableDiv/index.vue";
	import skyLineHandler from "./handler/skyLineHandle.js";
	import useLoginStore from "@/store/login.js";
	import { storeToRefs } from 'pinia';
	const { proxy } = getCurrentInstance();
	const loginStore = useLoginStore();
	const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
	const changeRate = ref(0);
	const activeStatus = ref(false);
	const topItem = ref();
	const rightItem = ref();
	const isshowskyline = ref(true);
	const showdrawchart = ref(false);
	const dialogHeight = ref("12vh"); // 整个对话弹框的高度
	const emits = defineEmits(["close"]);
	const props = defineProps({
		top: {
			type: String,
			default: "50vh",
		},
		left: {
			type: String,
			default: "10vh",
		},
	});
	function closeDiv() {
		emits("close");
		clearSkyLine();
	}
	// 提取天际线
	function extractSkyLine() {
		showdrawchart.value = false;
		dialogHeight.value = "12vh";
		skyLineHandler.clearSkyLine();
		skyLineHandler.extractSkyline();
	}
	// 绘制天际线
	function draw2DSkyline() {
		if (skyLineHandler.checkskyline2d() == true) {
			dialogHeight.value = "34vh";
			showdrawchart.value = true;
			setTimeout(() => {
				 skyLineHandler.getSkyline2D();
			}, 1000);
		}
	}
	// 清除天际线
	function clearSkyLine() {
		dialogHeight.value = "12vh";
		showdrawchart.value = false;
		skyLineHandler.clearSkyLine();
	}
	// 隐藏
	function hide() {
		clearSkyLine();
	}
	// 显示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		topItem.value = props.top;
		rightItem.value = props.left;
		let element = proxy.$refs.skylineDomRefs;
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
	<div id="skylineDom" :class="activeClass" ref="skylineDomRefs">
		<popdialog
			:divId="'skyline'"
			:title="'天际线分析'"
			:isshowdialog="isshowskyline"
			:width="'36vh'"
			:height="dialogHeight"
			:top="topItem"
			:left="rightItem"
			@close="closeDiv"
		>
			<template v-slot:container>
				<div class="skylineDiv">
					<div class="skyline-content">
						<el-button type="primary" class="skylineBtn" @click="extractSkyLine">提取天际线</el-button>
						<el-button type="primary" class="skylineBtn" :class="showdrawchart ? 'select' : ''" @click="draw2DSkyline"
							>绘制天际线</el-button
						>
						<el-button type="primary" class="clearSkyline" @click="clearSkyLine"></el-button>
					</div>
					<div class="skyline-chart" v-show="showdrawchart ? true : false">
						<div id="skyline-map" class="skyline-div"></div>
					</div>
				</div>
			</template>
		</popdialog>
	</div>
</template>

<style scoped lang="less">
	@import url("./assets/skyline.less");
	#skylineDom {
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
</style>
