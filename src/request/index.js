import axios from "axios";
import { getSession, setSession, removeSession } from "@/utils/tools/sessionStorage";
import { ElMessage } from "element-plus";
import useLoginStore from "@/store/login";
import qs from "qs";
import router from "@/router/index.js";
// axios 使用文档https://www.kancloud.cn/yunye/axios/234845
// http request 请求拦截器
// 创建一个axios实例
const instance = axios.create({
	baseURL: FyConfig.IP,
	headers: {
		"Content-Type": "application/json;charset=utf-8",
		"Access-Control-Allow-Origin": "*",
		withCredentials: true,
	},
	timeout: 20000,
});

instance.interceptors.request.use(
	(config) => {
		// 在发送请求之前携带token
		let token = getSession("FyAccessToken");
		if (token) config.headers.token = `${token}`;
		if (config.method === "get") {
			config.paramsSerializer = function (params) {
				return qs.stringify(params, { arrayFormat: "repeat" });
			};
		}
		return config;
	},
	(error) => {
		// 请求错误
		return Promise.reject(error);
	},
);
// http response 响应拦截器
instance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		if (error.response) {
			switch (error.response.status) {
				// 返回401，清除token信息并跳转到登录页面
				case 401 || "401":
					backLogin();
					ElMessage.error("登录过期!");
					break;
				default:
					// ElMessage.info(error.response.data.message);
					if (error.response.data && error.response.data.message) {
						ElMessage.error(error.response.data.message);
					} else {
						ElMessage.info("请稍后再试!");
					}
					break;
			}
			// return Promise.reject(error.response);
		} else {
			ElMessage.info("请稍后再试!");
		}
		// return Promise.reject(error);
	},
);
// 返回登录页
function backLogin() {
	// 移除token
	removeSession("FyAccessToken");
	// 移除用户名
	removeSession("FyUserDetail");
	// 移除菜单选中状态
	removeSession("FyMenuActiveIndex");
	// vue状态置空
	const loginStore = useLoginStore();
	loginStore.$patch({
		FyUserDetail: "",
		FyMenuActiveIndex: "",
	});
	// 跳转login
	router.push({ path: "/login" });
}
/**
 * @Author: dongnan
 * @Description: axios post请求
 * @Date: 2022-05-12 10:49:10
 * @param {String} url "http://192.168.1.34:8000/userinfo"
 * @param {Object} data Body Data 参数{username:"dongnan"}
 */
export function post(url, data, config = {}) {
	return new Promise((resolve, reject) => {
		instance
			.post(url, data, config)
			.then(
				(response) => {
					// 接口成功
					if (response) {
						resolve(response.data);
					} else {
						reject("无返回值");
					}
				},
				(err) => {
					// 接口错误
					reject(err);
				},
			)
			.catch((error) => {
				// 程序异常
				reject(error);
			});
	});
}
/**
 * @Author: dongnan
 * @Description: axios get请求
 * @Date: 2022-05-12 11:50:42
 * @param {*} url "http://192.168.1.34:8000/userinfo"
 * @param {*} params Query Params 参数{username:"dongnan"}
 */
export function get(url, params, config = {}) {
	return new Promise((resolve, reject) => {
		config.params = params;
		instance
			.get(url, config)
			.then(
				(response) => {
					// 接口成功
					if (response) {
						resolve(response.data);
					} else {
						reject("无返回值");
					}
				},
				(err) => {
					// 接口错误
					reject(err);
				},
			)
			.catch((error) => {
				// 程序异常
				reject(error);
			});
	});
}
export { instance };
