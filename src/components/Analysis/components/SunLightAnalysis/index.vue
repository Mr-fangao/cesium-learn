<script setup>
	import popdialog from "../dragableDiv/index.vue";
	import sunLightHandler from "./handler/sunlighthandler.js";
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
	const isshowsunlight = ref(true);
	const isShadow = ref(false);
	const chooseTime = ref(null);
	const starttimeoptions = ref([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
	const endtimeoptions = ref([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]);
	const layername = ref("");
	const layernames = ref([]);
	const startTime = ref(10);
	const endTime = ref(12);
	const bottomHeight = ref(0); // 底部高程
	const extrudeHeight = ref(30); // 拉伸高度
	const spacing = ref(3); // 点间距
	const shadowQueryAtt = ref({});
	const timeout = ref(null);
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
		shadowQueryClear();
	}
	// 绘制范围
	function shadowQueryClick() {
		sunLightHandler.shadowAnalysis();
		isShadow.value = true;
	}
	// 获取采光率
	function shadowRadioClick() {
		sunLightHandler.getShadowTooltip();
	}
	// 清除绘制
	function shadowQueryClear() {
		isShadow.value = false;
		sunLightHandler.clearSunlight();
		sunLightHandler.closeShadowQuery(true);
	}

	watch(startTime, (newval, oldval) => {
		if (!isShadow.value) return;
		shadowQueryAtt.value.chooseTime = chooseTime.value;
		shadowQueryAtt.value.startTime = newval;
		sunLightHandler.updateShadowAnlysis(shadowQueryAtt.value);
	});
	watch(endTime, (newval, oldval) => {
		if (!isShadow.value) return;
		shadowQueryAtt.value.chooseTime = chooseTime.value;
		shadowQueryAtt.value.endTime = newval;
		sunLightHandler.updateShadowAnlysis(shadowQueryAtt.value);
	});
	watch(bottomHeight, (newval, oldval) => {
		if (isNaN(newval) || newval == "" || newval <= 0 || !isShadow.value) return;
		clearTimeout(timeout.value);
		timeout.value = setTimeout(() => {
			shadowQueryAtt.value.extrudeHeight = extrudeHeight.value;
			shadowQueryAtt.value.bottomHeight = newval;
			sunLightHandler.updateShadowAnlysis(shadowQueryAtt.value);
		}, 300);
	});
	watch(extrudeHeight, (newval, oldval) => {
		if (isNaN(newval) || newval == "" || newval <= 0 || !isShadow.value) return;
		clearTimeout(timeout.value);
		timeout.value = setTimeout(() => {
			shadowQueryAtt.value.bottomHeight = bottomHeight.value;
			shadowQueryAtt.value.extrudeHeight = newval;
			sunLightHandler.updateShadowAnlysis(shadowQueryAtt.value);
		}, 300);
	});
	watch(spacing, (newval, oldval) => {
		if (isNaN(newval) || newval == "" || newval <= 0 || !isShadow.value) return;
		clearTimeout(timeout.value);
		timeout.value = setTimeout(() => {
			shadowQueryAtt.value.spacing = newval;
			sunLightHandler.value.updateShadowAnlysis(shadowQueryAtt.value);
		}, 300);
	});

	onMounted(() => {
		sunLightHandler.SetVueInstance(proxy.$.devtoolsRawSetupState);
		let time = new Date();
		chooseTime.value = time.getFullYear() + "-" + (time.getMonth() + 1) + "-" + time.getDate();
		nextTick(() => {
			sunLightHandler.init();
		});
	});
	onUnmounted(() => {
		shadowQueryClear();
	});
	// 隐藏
	function hide() {
		shadowQueryClear;
	}
	// 显示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		topItem.value = props.top;
		rightItem.value = props.left;
		let element = proxy.$refs.sunlightDomRefs;
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
	<div id="sunlightDom" ref="sunlightDomRefs" :class="[activeClass]">
		<popdialog
			:divId="'sunlight'"
			:title="'日照分析'"
			:isshowdialog="isshowsunlight"
			:width="'36vh'"
			:height="'36vh'"
			:top="topItem"
			:left="rightItem"
			@close="closeDiv"
		>
			<template v-slot:container>
				<div class="sunlightDiv">
					<div class="titlecontener">
						<el-button type="primary" class="drawArea" @click="shadowQueryClick">绘制范围</el-button>
						<el-button type="primary" class="" @click="shadowRadioClick">获取采光率</el-button>
						<el-button type="primary" class="clearBtn" @click="shadowQueryClear"></el-button>
					</div>
					<el-form class="sunlight-setting-content">
						<el-form-item label="日期选择:">
							<el-date-picker ref="datepicker" v-model="chooseTime"></el-date-picker>
						</el-form-item>
						<el-form-item label="开始时间:">
							<el-select v-model="startTime">
								<el-option
									v-for="(item, index) in starttimeoptions"
									:key="index"
									:label="item.toString() + ':00'"
									:value="item"
								></el-option>
							</el-select>
						</el-form-item>
						<el-form-item label="结束时间:">
							<el-select v-model="endTime">
								<el-option
									v-for="(item, index) in endtimeoptions"
									:key="index"
									:label="item.toString() + ':00'"
									:value="item"
								></el-option>
							</el-select>
						</el-form-item>
						<el-form-item label="底部高程:">
							<el-input v-model="bottomHeight" />
						</el-form-item>
						<el-form-item label="拉伸高度:">
							<el-input v-model="extrudeHeight" />
						</el-form-item>
						<el-form-item label="点间距:" label-width="5em">
							<el-input v-model="spacing" />
						</el-form-item>
					</el-form>
				</div>
			</template>
		</popdialog>
	</div>
</template>

<style scoped lang="less">
	@import url("./assets/sunlight.less");
	#sunlightDom {
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
<style>
	.titlecontener {
		.el-button {
			margin-left: 3vh;
		}
	}
	.sunlight-setting-content {
		.el-form-item {
			margin-bottom: 0.5vh;
			.el-form-item__label {
				color: #ffffffcc;
				margin-left: 3vh;
			}
			.el-form-item__content {
				.el-input {
					width: 22vh;
					background: transparent;
					border: 1px solid #ccc;
					border-radius: 5px;
					color: #ffffffb2;
					height: 3.2vh;
					line-height: 3.2vh;
				}
				.el-input__wrapper {
					background: transparent;
				}
				.el-input__inner {
					color: #ffffffcc;
				}
			}
		}
	}
</style>
