import { defineStore } from "pinia";
import { ref, reactive, toRefs } from "vue";
import { setSession, removeSession } from "@/utils/tools/sessionStorage";
import { setItem, getItem, removeItem } from "@/utils/tools/localstorage";
import { post } from "@/request/index.js";
/**
 * 构造树型结构数据
 * @param {*} data 数据源
 * @param {*} id id字段 默认 'id'
 * @param {*} parentId 父节点字段 默认 'parentId'
 * @param {*} children 孩子节点字段 默认 'children'
 */
function handleTree(data, id, parentId, children) {
	let config = {
		id: id || "id",
		parentId: parentId || "parentId",
		childrenList: children || "children",
	};

	var childrenListMap = {};
	var nodeIds = {};
	var tree = [];
	for (let d of data) {
		let parentId = d[config.parentId];
		if (!Array.isArray(childrenListMap[parentId])) {
			childrenListMap[parentId] = [];
		}
		nodeIds[d[config.id]] = d;
		childrenListMap[parentId].push(d);
	}

	for (let d of data) {
		let parentId = d[config.parentId];
		if (nodeIds[parentId] == null) {
			tree.push(d);
		}
	}

	for (let t of tree) {
		adaptToChildrenList(t);
	}

	function adaptToChildrenList(o) {
		if (childrenListMap[o[config.id]] !== null) {
			o[config.childrenList] = childrenListMap[o[config.id]];
		}
		if (o[config.childrenList]) {
			for (let c of o[config.childrenList]) {
				adaptToChildrenList(c);
			}
		}
	}
	return tree;
}
export default defineStore("login", () => {
	const state = reactive({
		FyRouteList: "",
		FyUserDetail: "",
		MenuIndex: "/largescreen/main", //默认主页
		MapMode: "image", //vector，image,fullview
		leftCollapse: true,
		rightCollapse: true,
		weather: null,
		areaCode: null,
		areaId: null,
		areaName: null,
		areaParentCode: null,
		areaParentName: null,
		airPortDetail: {}, //机库信息
		airLineDetail: {}, //航线信息
		airTaskDetail: {}, //飞行任务信息
		airDetail: {}, //无人机信息
		taskstatus: [
			{ status: -1, statusname: "正在执行", function: "详情", color: "#69adfc" },
			{ status: 0, statusname: "待执行", function: "立即执行", color: "#69c9fb" },
			{ status: 1, statusname: "执行完成", function: "回放", color: "#0df6a0" },
			{ status: 2, statusname: "执行失败", function: "详情", color: "#dc2828" },
		],
		isFly: false,
	});
	// 登录
	function Login(data) {
		const username = data.username.trim();
		const userpwd = data.userpwd;
		return new Promise((resolve, reject) => {
			post("/auth/user/login", {
				userName: username,
				password: userpwd,
			})
				.then((res) => {
					if (res.code == 0) {
						let data = res.data;
						let user = {
							nickName: data.user.nickName,
							username: data.user.userName,
							userpwd: userpwd,
							areaCode: data.user.areaCode,
						};
						// 存储token及用户名
						if (data.menuInfo && data.menuInfo.length > 0) {
							let routeList = handleTree(data.menuInfo, "menuId", "parentId");
							setSession("FyRouteList", JSON.stringify(routeList));
						} else {
							setSession("FyRouteList", "null");
						}
						setSession("FyAccessToken", data.token);
						setSession("UserID", data.user.id);
						setSession("FyUserDetail", JSON.stringify(user));
						state.FyUserDetail = JSON.stringify(user);
						resolve("登录成功");
					}
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
	// 注册
	function Register(data) {
		const username = data.username;
		const userpwd = data.userpwd;
		const email = data.email;
		return new Promise((resolve, reject) => {
			post(LoginApi.register, {
				username: username,
				userpwd: userpwd,
				email: email,
			}).then((res) => {
				if (res.code == 200) {
					// 存储用户状态
					state.UserName = username;
					state.UserPwd = userpwd;
					resolve("注册成功");
				} else if (res.code == 202) {
					reject("用户名已存在");
				} else if (res.code == 404) {
					reject("注册失败,请联系管理员");
				}
			});
		});
	}
	// 退出系统
	function Logout() {
		return new Promise((resolve, reject) => {
			removeSession("FyAccessToken");
			removeSession("FyUserDetail");
			removeSession("UserID");
			// 路由置空
			state.FyUserDetail = "";
			resolve("已退出!");
		});
	}
	// 展开面板
	function openPanel() {
		state.leftCollapse = false;
		state.rightCollapse = false;
	}
	// 折叠面板
	function closePanel() {
		state.leftCollapse = true;
		state.rightCollapse = true;
	}

	return {
		...toRefs(state),
		Login,
		Logout,
		Register,
		openPanel,
		closePanel,
	};
});
