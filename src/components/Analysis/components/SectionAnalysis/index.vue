<script setup>
	import popdialog from "../dragableDiv/index.vue";
	import sectionhandler from "./handler/SectionAnalysis.js";
	import Bus from "@/buss/eventBus.js";
	import coordinate from "@/utils/cesium/Coordinates.js";
	import useLoginStore from "@/store/login.js";
	import { storeToRefs } from 'pinia';
	const { proxy } = getCurrentInstance();
	const loginStore = useLoginStore();
	const { leftCollapse, rightCollapse } = storeToRefs(loginStore);
	const changeRate = ref(0);
	const activeStatus = ref(false);
	const topItem = ref();
	const rightItem = ref();

	const dialogHeight = ref("12vh");
	const isshowsection = ref(true);
	const startdrawsection = ref(false); // 开始绘制
	const showdrawchart = ref(false); // 展示分析绘制的图形
	const leftclicknum = ref(0);
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
		// proxy.$parent.currentselectedanalysis = 0;
		emits("close");
		clearSection();
	}
	// 绘制范围
	function sectionAnalysis() {
		startdrawsection.value = true;
		leftclicknum.value = 0;
	}

	// 清除高程
	function clearSection() {
		dialogHeight.value = "12vh";
		sectionhandler.ClearEntity();
		leftclicknum.value = 0;
		showdrawchart.value = false;
		startdrawsection.value = false;
	}

	function setdata(datalist) {
		nextTick(() => {
			refreshbar(datalist);
		});
	}

	function refreshbar(data) {
		let barcontainer = document.getElementById("section-draw");
		let xwidth = barcontainer.clientWidth - 40 - 20;
		let yheight = barcontainer.clientHeight - 60 - 60;
		let dis = coordinate.CoordinateWGS84.GetDistancePlane(
			new coordinate.CoordinateWGS84(data[0].longitude, data[0].latitude, 0),
			new coordinate.CoordinateWGS84(data[data.length - 1].longitude, data[data.length - 1].latitude, 0),
		);
		let ydata = data.map((item) => {
			return item.height;
		});
		let ymax = parseInt((yheight * dis) / xwidth);
		let barChart = echarts.init(barcontainer);
		let option = {
			title: {
				show: false,
			},
			grid: {
				top: 20,
				bottom: 20,
				left: 30,
				right: 20,
			},
			color: ["#ffcc00"],
			tooltip: {
				trigger: "axis",
				formatter: function (params) {
					let param = data[params[0].axisValue];
					return (
						"经度:" +
						parseInt(param.longitude * 100) / 100 +
						"</br>纬度:" +
						parseInt(param.latitude * 100) / 100 +
						"</br>高程:" +
						parseInt(param.height * 100) / 100 +
						"米"
					);
				},
				axisPointer: {
					animation: false,
				},
				textStyle: {
                        fontSize: proxy.vh2px(1.2),
                     },
			},
			xAxis: {
				type: "category",
				data: data.map((item) => {
					return item.id;
				}),
				axisLine: {
					lineStyle: {
						color: "#fff",
					},
				},
				axisLabel: {
					show: false,
					textStyle: {
							color: "#a3acb2",
							fontSize: proxy.vh2px(1.2),
						},
				},
				axisTick: {
					show: false,
				},
			},
			yAxis: {
				type: "value",
				axisLine: {
					lineStyle: {
						color: "#fff",
					},
				},
				min: 0,
				max: ymax,
			},
			series: [
				{
					data: ydata,
					type: "line",
					showSymbol: false,
					hoverAnimation: false,
				},
			],
		};
		barChart.setOption(option, true);
	}

	onMounted(() => {
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Left_Click, function (movement) {
			if (!startdrawsection.value) return;
			if (leftclicknum.value % 2 == 0) {
				sectionhandler.HandleMouseFirstClick(movement.position);
			} else if (leftclicknum.value % 2 == 1) {
				sectionhandler.HandleMouseSecondClick(movement.position);
				showdrawchart.value = true;
				dialogHeight.value = "36vh";
				setdata(sectionhandler.GetDrawEchartData());
			}
			leftclicknum.value++;
		});
		Bus.VM.$on(Bus.SignalType.Scene_Mouse_Move, function (movement) {
			if (leftclicknum.value % 2 == 1) {
				sectionhandler.HandleMouseMove(movement.endPosition);
			}
		});
	});
	function hide() {
		clearSection();
	}
	// 显示
	function show() {
		changeRate.value = 0;
		activeStatus.value = leftCollapse.value;
		topItem.value = props.top;
		rightItem.value = props.left;
		let element = proxy.$refs.sectionDomRefs;
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
	<div id="sectionDom" ref="sectionDomRefs" :class="activeClass">
		<popdialog
			:divId="'section'"
			:title="'剖面分析'"
			:isshowdialog="isshowsection"
			:width="'36vh'"
			:height="dialogHeight"
			:top="topItem"
			:left="rightItem"
			@close="closeDiv"
		>
			<template v-slot:container>
				<div class="sectionDiv">
					<div class="section-content">
						<el-button type="primary" class="sectionBtn" :class="showdrawchart ? 'select' : ''" @click="sectionAnalysis"
							>绘制范围</el-button
						>
						<el-button type="primary" class="spatialanalysisclear" @click="clearSection"></el-button>
					</div>
					<div class="section-chart" v-show="showdrawchart">
						<div id="section-draw"></div>
					</div>
				</div>
			</template>
		</popdialog>
	</div>
</template>

<style scoped lang="less">
	@import url("./assets/section.less");
	#sectionDom {
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
