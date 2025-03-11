<!--
 * @Author: wyy
 * @Date: 2025-01-21 10:11:56
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 16:18:20
 * @Description: 
-->
<template>
  <div class="login-container">
    <div class="login-box">
      <div class="loginMask1"></div>
      <el-form ref="loginFormRef" :model="loginForm" status-icon :rules="loginRules" class="loginForm">
        <label class="title">cesium实践</label>
        <el-form-item prop="name" class="userInput">
          <el-input v-model="loginForm.username" placeholder="请输入用户名/手机号">
            <template #prefix>
              <img src="../assets/user.svg" alt="" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="pass" class="passwordInput">
          <el-input v-model="loginForm.password" type="password" autocomplete="off" placeholder="请输入密码"
            @keyup.enter.native="handleLogin()">
            <template #prefix>
              <img src="../assets/password.svg" alt="" />
            </template>
          </el-input>
        </el-form-item>
        <div class="remember">
          <el-checkbox v-model="remeberAccount" label="记住账号" />
        </div>
        <el-row class="loginButton">
          <el-button type="primary" @click="handleLogin()">登录</el-button>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';

const router = useRouter();

const loginForm = ref({
  username: '',
  password: '',
});
const remeberAccount = ref(false)
const loginRules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 10, message: '用户名长度在 3 到 10 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 16, message: '密码长度在 6 到 16 个字符', trigger: 'blur' },
  ],
});

const loginFormRef = ref<FormInstance | null>(null);

const handleLogin = () => {
  if (loginFormRef.value) {
    loginFormRef.value.validate((valid) => {
      if (valid) {
        // 模拟登录成功
        ElMessage.success('登录成功！');
        console.log('登录数据:', loginForm.value);
        // 跳转到菜单页面
        router.push('/menu');
      } else {
        ElMessage.error('请检查表单输入');
      }
    });
  }
};
</script>

<style lang="less" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url('../assets/bg_cp.png');
  /* 替换为你的背景图片路径 */
  background-size: cover;
  background-position: center;
}

.login-box {
  width: 100%;
  height: 100%;
}
.loginForm {
			width: 42vh;
			height: 37vh;
			position: absolute;
			left: calc((100% - 42vh) / 2);
			top: calc((100% - 37vh) / 2);
		}
		.loginMask1 {
			width: 60vh;
			height: 51vh;
			position: absolute;
			left: calc((100% - 60vh) / 2);
			top: calc((100% - 51vh) / 2);
			background: url("../assets/bg2.png") no-repeat;
			background-size: 100% 100%;
			z-index: 5;
		}
		.loginForm {
			z-index: 8;
			.title {
				display: block;
				font-size: 3.2vh;
				color: #fff;
				margin-bottom: 5vh;
				text-align: center;
				letter-spacing: 0.5vh;
				font-family: "puhui_Heavy_105";
			}
			:deep(.el-form-item) {
				margin-left: 2vh;
			}
			:deep(.el-form-item__error) {
				left: 5vh;
				font-size: 1.4vh;
				&:before {
					content: "";
					background: url("../assets/error.svg") no-repeat;
					background-size: 100% 100%;
					width: 1.6vh;
					height: 1.6vh;
					display: inline-block;
					vertical-align: top;
					padding-right: 0.5vh;
				}
			}
			:deep(.el-input) {
				width: 100%;
				.el-input__wrapper {
					background-color: transparent !important;
					box-shadow: none !important;
				}

				.el-input__inner {
					padding-left: 2vh;
					height: 3.5vh;
					line-height: 3.5vh;
					color: #fff;
					font-size: 1.8vh;
					border-radius: 0;
					box-shadow: none;
					border-bottom: 1px solid rgba(255, 255, 255, 0.2);
					background: transparent !important;
				}

				img {
					width: 2.2vh;
					height: 2.2vh;
					position: absolute;
					left: -3vh;
					opacity: 0.7;
				}
				.el-input__suffix {
					display: none;
				}
			}
			.userInput {
				margin-bottom: 5vh;
			}
			.passwordInput {
				margin-bottom: 2vh;
			}
			.remember {
				margin-bottom: 4.5vh;
				font-size: 14px;
				margin-left: 3.2vh;
				width: 50%;
				text-align: left;
				:deep(.el-checkbox) {
					height: auto;
					color: #abadaf;
					.el-checkbox__input {
						&.is-checked + .el-checkbox__label {
							color: #abadaf;
						}
						.el-checkbox__inner {
							background-color: transparent;
							border-color: #abadaf;
							font-size: 1.8vh;
							width: 1.8vh;
							height: 1.8vh;
							&::after {
								border-color: #abadaf;
								height: 0.8vh;
								left: 0.5vh;
								position: absolute;
								top: 0.1vh;
								// transform: rotate(45deg) scaleY(0);
								width: 0.3vh;
							}
						}
					}
					.el-checkbox__label {
						font-size: 1.8vh;
					}
				}
			}
			.identifyCode {
				margin-bottom: 5.65vh;
				:deep(.el-input) {
					margin-right: 1.5vh;
					width: 20vh;
				}
				#s-canvas {
					height: 4vh;
					width: 11vh;
					display: inline-block;
				}
			}

			.loginButton {
				:deep(.el-button) {
					width: 30vh;
					height: 6.2vh;
					font-size: 2.6vh;
					border-radius: 5vh;
					border: none;
					background: #1863ae;
					color: #fff;
					letter-spacing: 0.5vh;
					margin: 0 auto;
				}
			}
		}
.login-button {
  width: 100%;
}
</style>