/*
 * @Author: liqifeng
 * @Date: 2025-03-11 11:00:44
 * @LastEditors: Mr-fangao Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 22:12:30
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
// 创建应用实例
const app = createApp(App);

// 使用 Pinia
const pinia = createPinia();
app.use(pinia);

// 使用 Element Plus
app.use(ElementPlus);

app.config.globalProperties.$dat = dat;
app.use(router);
// 挂载应用
app.mount('#app');
