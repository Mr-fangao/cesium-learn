import router from "../router";
import { ElMessage } from "element-plus";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { getSession } from "@/utils/tools/sessionStorage";
import useLoginStore from "@/store/login";
import Bus from "@/buss/eventBus";
import Layout from "@/views/ThreeDMap/index.vue";
import BlankView from "@/views/ThreeDMap/loading.vue";

NProgress.configure({ showSpinner: false });

// 白名单 免登录
const whiteList = ["/login", "/register"];
// 匹配views里面所有的.vue文件
const modules = import.meta.glob("./../views/**/*.vue");
// 添加组件
const loadView = (view, name) => {
	let res;
	for (const path in modules) {
		const dir = path.split("views/")[1].split(".vue")[0];
		if (dir == view) {
			let comp = modules[path]();
			comp.then((config) => {
				config.default.name = name;
			});
			res = async () => await comp;
			break;
		}
	}
	return res;
};
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
// 整理路由
function handleRouteTree(treeList) {
	const view = [];
	function extractData(arr, path) {
		for (let i = 0; i < arr.length; i++) {
			if (Array.isArray(arr[i].children) && arr[i].children.length > 0) {
				let newPath;
				if (path) {
					newPath = path + "/" + arr[i].path;
				} else {
					newPath = "/" + arr[i].path;
				}
				extractData(arr[i].children, newPath);
				delete arr[i].children;
			}
			if (!path) {
				arr[i].path = "/" + arr[i].path;
			}
			if (arr[i].componentPath) {
				arr[i].component = loadView(arr[i].componentPath, arr[i].menuId);
				if (!arr[i].component) {
					arr[i].component = async () => await BlankView;
					console.log(arr[i].componentPath + "组件路径找不到...");
				}
			}
			if (arr[i].parentId == "-1") {
				if (!arr[i].component) {
					arr[i].component = async () => await Layout;
				}
			}
			if (arr[i].component) {
				view.push({
					menuId: arr[i].menuId,
					parentId: arr[i].parentId,
					path: arr[i].path,
					component: arr[i].component,
					meta: { title: arr[i].menuName },
					name: arr[i].menuId,
				});
			} else {
				view.push({
					menuId: arr[i].menuId,
					parentId: arr[i].parentId,
					path: arr[i].path,
					meta: { title: arr[i].menuName },
					name: arr[i].menuId,
				});
			}
		}
	}
	extractData(treeList);
	return view;
}
// 处理route
function dealRoute(list) {
	let routeList = [];
	list.some((item) => {
		if (!item.children) {
			let temp = {
				path: "",
				component: async () => await Layout,
				children: [item],
			};
			routeList.push(temp);
		} else {
			routeList.push(item);
		}
	});
	return routeList;
}
// 全局前置守卫，路由跳转前触发
router.beforeEach((to, from, next) => {
	NProgress.start();
	let token = getSession("FyAccessToken");
	if (token) {
		// 登录成功 有token
		// 登录成功 则不跳转登录界面
		if (to.path === "/login") {
			next({ path: "/" });
		} else {
			// 更新数据
			const loginStore = useLoginStore();
			if (loginStore.FyUserDetail == "") {
				loginStore.$patch({
					FyUserDetail: getSession("FyUserDetail"),
				});
			}
			// vux内路由是否有 没有就重新获取
			if (loginStore.FyRouteList == "") {
				let str = getSession("FyRouteList");
				if (str && str != "" && str != "null") {
					let list = JSON.parse(str);
					loginStore.$patch({
						FyRouteList: JSON.stringify(list),
					});
					// 适配路由
					let newList = handleRouteTree(list);
					let totalRouteTree = handleTree(newList, "menuId", "parentId");
					let routeTree = [totalRouteTree.find((item) => item.meta.title == "低空监测大屏")];
					let routeList = dealRoute(routeTree);
					routeList.some((item) => {
						router.addRoute(item);
						router.options.routes.push(item);
					});
					next({ ...to, replace: true }); // hack方法 确保addRoutes已完成
				} else {
					loginStore.$patch({
						FyRouteList: "null",
					});
					next();
				}
			} else {
				// 放行
				next();
			}
		}
	} else {
		// 登录失败 没有token
		if (whiteList.indexOf(to.path) !== -1) {
			// 在免登录白名单，直接进入
			next();
		} else {
			next(`/login?redirect=${to.path}`); // 否则全部重定向到登录页
		}
	}
});

// 全局后置守卫，路由跳转完成后触发
router.afterEach(() => {
	NProgress.done();
});
