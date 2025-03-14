<script setup>
	import popdialog from "../dragableDiv/index.vue";
	import limitheightHandle from "./handler/limitHeightHandle.js";
	import msgUtil from "@/buss/MessageUtil.js";
	import useLoginStore from "@/store/login.js";
	import { storeToRefs } from 'pinia';
	const { proxy } = getCurrentInstance();
	const loginStore = useLoginStore();
	const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
	const changeRate = ref(0);
	const activeStatus = ref(false);
	const topItem = ref();
	const rightItem = ref();
	const emits = defineEmits(["close"]);
	const isshowlimitheight = ref(true);
	const limitHeightEnable = ref(false);
	const linearExtrudeHeight = ref(100); // 填挖的高度
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
		// proxy.$parent.currentselectedanalysis = 0;
		emits("close");
		clearLimitHeight();
	}
	// 绘制范围
	function limitHeightAnalysis() {
		//执行分析前判断阈值合法性
		if (judgeThreshold(linearExtrudeHeight.value)) {
			limitHeightEnable.value = !limitHeightEnable.value;
			limitheightHandle.linearExtrudeAna(linearExtrudeHeight.value);
		}
	}
	function checkNum(value) {
		return !isNaN(value);
	}
	function judgeThreshold(value) {
		if (!value) {
			msgUtil.messagePrompt("warning", "请设置限高阈值");
			return false;
		} else if (!checkNum(Number(value))) {
			msgUtil.messagePrompt("warning", "限高阈值格式非法");
			return false;
		} else if (Number(value) <= 0) {
			msgUtil.messagePrompt("warning", "限高阈值必须大于零");
			return false;
		} else {
			return true;
		}
	}
	// 清除高程
	function clearLimitHeight() {
		limitHeightEnable.value = false;
		limitheightHandle.clearLinearExtrude();
	}

	onMounted(() => {
		limitheightHandle.SetVueInstance(proxy.$.devtoolsRawSetupState);
	});
	function hide() {
		clearLimitHeight();
	}
	// 显示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		topItem.value = props.top;
		rightItem.value = props.left;
		let element = proxy.$refs.limitheightDomRefs;
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
	<div id="limitheightDom" ref="limitheightDomRefs" :class="activeClass">
		<popdialog
			:divId="'limitheight'"
			:title="'限高分析'"
			:isshowdialog="isshowlimitheight"
			:width="'36vh'"
			:height="'12vh'"
			:top="topItem"
			:left="rightItem"
			@close="closeDiv"
		>
			<template v-slot:container>
				<div class="limitheightDiv">
					<div class="limitheight-content">
						<el-button
							type="primary"
							class="limitheighBtn"
							:class="limitHeightEnable ? 'select' : ''"
							@click="limitHeightAnalysis"
							>绘制范围</el-button
						>
						<el-button type="primary" class="spatialanalysisclear" @click="clearLimitHeight"></el-button>
						<div class="limitheight_text">限高阈值</div>
						<el-input class="limitheight_input" v-model="linearExtrudeHeight"></el-input>
						<div class="limitheight_text">米</div>
					</div>
				</div>
			</template>
		</popdialog>
	</div>
</template>

<style scoped lang="less">
	@import url("./assets/limitheight.less");
	#limitheightDom {
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
