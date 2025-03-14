<script setup>
	const props = defineProps({
		width: {
			type: String,
			default: "40vh",
		},
		height: {
			type: String,
			default: "30vh",
		},
		top: {
			type: String,
			default: "7vh",
		},
		left: {
			type: String,
			default: "",
		},
		right: {
			type: String,
			default: "0vh",
		},
		bottom: {
			type: String,
			default: "",
		},
		divId: {
			type: String,
			default: "",
		},
		title: {
			type: String,
			default: "",
		},
		isshowdialog: {
			type: Boolean,
			default: false,
		},
		showclose: {
			type: Boolean,
			default: true,
		},
		MaxHeight: {
			type: String,
			default: "",
		},
	});
	const dragcontainerclassname = ref("popdialog-title");
	const emits = defineEmits(["closeDiv"]);
	function closeDiv() {
		emits("close");
	}
</script>

<template>
	<div
		:id="props.divId"
		class="popdialog"
		:class="{ 'popdialog-slide-in': props.isshowdialog }"
		v-drag:[dragcontainerclassname]
		v-show="props.isshowdialog"
		:style="
			'width:' +
			props.width +
			';height:' +
			props.height +
			';max-height:' +
			props.MaxHeight +
			';left:' +
			props.left +
			';top:' +
			props.top +
			';bottom:' +
			props.bottom +
			';right:' +
			props.right +
			';'
		"
	>
		<div class="popdialog-title">
			<span class="popdialog-title-text">{{ props.title }}</span>
			<img src="./assets/close-12px.svg" alt="" class="closeicon" @click="closeDiv" v-show="props.showclose" />
		</div>
		<div class="contentDiv">
			<slot name="container"></slot>
		</div>
	</div>
</template>

<style scoped>
	@import url("./assets/dragable.less");
</style>
<style lang="less">
	.popdialog-slide-in {
		transform: translateX(100%);
		animation: popdialog-slide-in 1.5s forwards;
	}

	@keyframes popdialog-slide-in {
		0% {
			transform: translateX(100%);
			opacity: 0;
		}
		100% {
			transform: translateX(0%);
			opacity: 1;
		}
	}
    .popdialog{
        .contentDiv{
            .el-button{
                background: #0785bb;
                border:none;
                /*background:red;*/
            }
            .el-input__wrapper{
                box-shadow: none;
                background:transparent;
                color:white;
            }
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
</style>
