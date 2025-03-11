/*
 * @Author: lqf
 * @Date: 2025-01-21 10:10:22
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 16:51:55
 * @Description:
 */
import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import { menuConfig } from '@/config/menu';
const routes = [
  {
    path: "/",
    redirect: "/login",
  },
  {
    path: "/login",
    component: () => import("@/views/Login/index.vue"),
  },
  {
    path: "/menu",
    component: () => import("@/views/Menu/index.vue"),
  },
  {
    path: "/cesiumviews",
    component: () => import("@/views/cesiumviews/index.vue"), // 公共布局组件
    children: [
      // 动态生成菜单路由
      ...menuConfig.map((menu) => ({
        path: menu.path,
        name: menu.id,
        component: () => import(`@/views/cesiumviews/components/${menu.id}.vue`), // 子菜单页面
      })),
    ],
  },
];
const router = createRouter({
  // history: createWebHistory(process.env.BASE_URL),
  history: createWebHashHistory(),
  routes,
});
export default router;
