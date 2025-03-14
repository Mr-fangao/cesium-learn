/*
 * @Author: liqifeng
 * @Date: 2025-03-11 11:00:44
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-14 15:22:40
 * @Description: 
 */
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css'
import router from "./router";
import * as dat from 'dat.gui';

import * as echarts from "echarts";
import "echarts-gl";
window.echarts = echarts; //挂载到window上
// 创建应用实例
const app = createApp(App);

// 使用 Pinia
const pinia = createPinia();
app.use(pinia);

// 全局组件及方法挂载
import utils from "./utils/index.js";
app.use(utils);


// 使用 Element Plus
app.use(ElementPlus);

app.config.globalProperties.$dat = dat;
app.use(router);
// 挂载应用
app.mount('#app');
