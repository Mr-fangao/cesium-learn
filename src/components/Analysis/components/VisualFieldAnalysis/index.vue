<script setup>
	import popdialog from "../dragableDiv/index.vue";
	import visualFieldHandler from "./handler/visualFieldHandler.js";
	import useLoginStore from "@/store/login.js";
	import { storeToRefs } from 'pinia';
	const { proxy } = getCurrentInstance();
	const loginStore = useLoginStore();
	const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
	const changeRate = ref(0);
	const activeStatus = ref(false);
	const topItem = ref();
	const rightItem = ref();
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

	const emits = defineEmits(["close"]);
	const isshowvisualfield = ref(true);
	const isshowresult = ref(false); // 是否展示可视域的分析结果
	const viewshed3DAddHeight = ref(2);
	const visualFieldEnable = ref(false);
	const dialogHeight = ref("12vh"); // 整个对话弹框的高度
	const viewshed3Datt = ref({
		direction: "",
		pitch: "",
		distance: "",
		horizontalFov: "",
		verticalFov: "",
	});
	const _direction = ref(1);
	const _pitch = ref(0);
	const _distance = ref(1);
	const _horizontalFov = ref(1);
	const _verticalFov = ref(1);
	const maxdistance = ref(500);
	const distancemarks = computed(() => {
		let result = {};
		result[1] = "1";
		result[maxdistance.value] = maxdistance.value.toString();
		return result;
	});
	function closeDiv() {
		emits("close");
		clearViewField();
	}

	function visualChange() {
		if (!isshowvisualfield.value) {
			return;
		}

		viewshed3Datt.value.direction = _direction.value;
		viewshed3Datt.value.pitch = _pitch.value;
		viewshed3Datt.value.distance = _distance.value;
		viewshed3Datt.value.horizontalFov = _horizontalFov.value;
		viewshed3Datt.value.verticalFov = _verticalFov.value;
		viewshed3Datt.value.viewshed3DAddHeight=viewshed3DAddHeight.value;
		visualFieldHandler.refreshViewshed3D(viewshed3Datt.value);
	}
	// 绘制可视域
	function getViewField() {
		visualFieldEnable.value = !visualFieldEnable.value;
		visualFieldHandler.getViewshed3D(viewshed3DAddHeight.value);
	}
	// 清除绘制的可视域
	function clearViewField() {
		dialogHeight.value = "12vh";
		visualFieldEnable.value = false;
		_direction.value = 0;
		_pitch.value = -90;
		_distance.value = 1;
		_horizontalFov.value = 1;
		_verticalFov.value = 1;
		visualFieldHandler.clearViewshed3D();
	}
	// 隐藏
	function hide() {
		clearViewField();
	}
	// 显示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		topItem.value = props.top;
		rightItem.value = props.left;
		let element = proxy.$refs.visualfieldDomRefs;
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
	onMounted(() => {
		visualFieldHandler.SetVueInstance(proxy.$.devtoolsRawSetupState);
	});
	defineExpose({
		hide,
		show,
	});
</script>

<template>
	<div id="visualfieldDom" :class="[activeClass]" ref="visualfieldDomRefs">
		<popdialog
			:divId="'visualfield'"
			:title="'可视域分析'"
			:isshowdialog="isshowvisualfield"
			:width="'40vh'"
			:height="dialogHeight"
			:top="topItem"
			:left="rightItem"
			@close="closeDiv"
		>
			<template v-slot:container>
				<div id="operate-content">
					<el-button type="primary" class="drawviewfield" :class="visualFieldEnable ? 'select' : ''" @click="getViewField"
						>绘制可视域</el-button
					>
					<el-button type="primary" class="spatialanalysisclear" @click="clearViewField"></el-button>
					<div class="addHeight_text">抬高设置</div>
					<el-input class="addHeight_input" v-model="viewshed3DAddHeight" @change="visualChange"></el-input>
					<div class="addHeight_text">米</div>
				</div>
				<div id="result-content" v-show="isshowresult">
					<div class="visual-shed-wrap">
						<div class="sliderblock">
							<span class="slidertext viewshed-attr-title">方向（度）</span>
							<el-slider
								class="sliderobj"
								:min="0"
								:max="360"
								:step="1"
								v-model="_direction"
								:marks="{ 0: '0', 360: '360' }"
								@input="visualChange"
							></el-slider>
						</div>
						<div class="sliderblock">
							<span class="slidertext viewshed-attr-title">翻转（度）</span>
							<el-slider
								class="sliderobj"
								:min="-90"
								:max="90"
								:step="1"
								v-model="_pitch"
								:marks="{ '-90': '-90', 90: '90' }"
								@input="visualChange"
							></el-slider>
						</div>
						<div class="sliderblock">
							<span class="slidertext viewshed-attr-title">距离（米）</span>
							<el-slider
								class="sliderobj"
								:min="1"
								:max="maxdistance"
								:step="1"
								v-model="_distance"
								:marks="distancemarks"
								@input="visualChange"
							></el-slider>
						</div>
						<div class="sliderblock">
							<span class="slidertext viewshed-attr-title">水平视场角（度）</span>
							<el-slider
								class="sliderobj"
								:min="1"
								:max="120"
								:step="1"
								v-model="_horizontalFov"
								:marks="{ 1: '1', 120: '120' }"
								@input="visualChange"
							></el-slider>
						</div>
						<div class="sliderblock">
							<span class="slidertext viewshed-attr-title">垂直视场角（度）</span>
							<el-slider
								class="sliderobj"
								:min="1"
								:max="90"
								:step="1"
								v-model="_verticalFov"
								:marks="{ 1: '1', 90: '90' }"
								@input="visualChange"
							></el-slider>
						</div>
						<div class="color-area">
							<div class="color-area-div">
								<div class="color-area-view"></div>
								<div class="color-area-label">可见区域颜色</div>
							</div>
							<div class="color-area-div">
								<div class="color-area-no-view"></div>
								<div class="color-area-label">不可见区域颜色</div>
							</div>
						</div>
					</div>
				</div>
			</template>
		</popdialog>
	</div>
</template>

<style scoped lang="less">
	@import url("./assets/visualfield.less");
</style>

<style lang="less">
	#visualfieldDom {
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
	.visual-shed-wrap .sliderobj {
		width: calc(100% - 18vh);
		margin-right: 4vh;
		float: right;
	}
	.visual-shed-wrap .el-slider__marks-text {
		font-size: 1.3vh;
		color: #ffffffcc;
	}
</style>
