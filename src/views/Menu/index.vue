<!--
 * @Author: liqifeng
 * @Date: 2025-01-23 17:32:44
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-14 11:12:18
 * @Description: 
-->
<template>
    <div class="container">
        <div class="card-list">
            <div v-for="card in cards" :key="card.id" class="card" @click="pushRouter(card.path)">
                <img :src="'/img/views/' + card.name + '.png'" alt="">
                <div class="card-title">{{ card.content }}</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { menuConfig } from '@/config/menu';
const router = useRouter();
// interface Card {
//     id: number;
//     content: string;
// }
// 定义 Menu 接口
interface Menu {
    id: number;
    path: string;
    content: string;
    // 如果还有其他属性，可以继续添加
}
const cards = ref<Menu[]>(
    menuConfig.map((menu: Menu) => ({
        path: menu.path,
        name: menu.id,
        content: menu.content,
        component: () => import(`@/views/cesiumviews/components/${menu.id}.vue`), // 子菜单页面
    })),
);
function pushRouter(path: string) {
    console.log(path);
    router.push(`${path}`);
}
onMounted(() => {
    console.log(cards.value);
});
</script>
<style lang="less" scoped>
.container {
    padding: 10vh 27vh;
    /* margin: 20px; */
    overflow-y: auto;
    overflow-x: hidden;
    /* 允许垂直滚动 */
    /* scrollbar-gutter: stable; */
    /* 预留滚动条空间 */
    height: calc(100vh - 20vh);
    width: calc(100vw - 54vh);
    /* 留出上下边距 */
    background-image: url("/img/BG/1.jpg");
    background-size: 100% 100%;
}

.container::-webkit-scrollbar {
    width: 12px;
}

.container::-webkit-scrollbar-track {
    background: #ffffff18;
    border-radius: 10px;
}

.container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 10px;
}

.container::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.card-list {
    display: flex;
    flex-direction: row;
    gap: 10vh;
    flex-wrap: wrap;
    /* justify-content: space-around; */
    /* 卡片之间的间隔 */
}

.card {
    width: 30vh;
    height: 22vh;
    padding: 5px;
    // border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f99d;
    text-align: center;
    box-sizing: border-box;
    position: relative;
    /* 为标题绝对定位提供基准 */
    overflow: hidden;
    /* 防止内容溢出圆角 */
    /* 背景图片设置 */
    // background-image: url('your-image-path.jpg');
    background-size: cover;
    /* 图片覆盖整个卡片 */
    background-position: center;
    /* 图片居中显示 */
    /* 悬停动效 */
    transition: transform 0.3s ease;

    img {
        z-index: 1;
        width: 100%;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        background-size: 100%;
        background-size: cover;
        /* 图片覆盖整个卡片 */
        background-position: center;
    }
}

.card:hover {
    transform: translateY(-5px);
    /* 悬停时轻微上浮 */
    cursor: pointer;
}

/* 标题样式 */
.card-title {
    width: calc(100% - 24px);
    font-size: 1em;
    font-weight: bold;
    color: #fff;
    background: linear-gradient(to right, rgba(0, 100, 200, 0.9), rgba(0, 150, 255, 0.9));
    /* 渐变背景 */
    padding: 8px 12px;
    border-radius: 4px;
    display: inline-block;
    /* 让标题背景自适应文字宽度 */
    margin: 0 auto 1vh;
    /* 居中并留出底部间距 */
    position: relative;
    /* 提升层级避免被背景图覆盖 */
    z-index: 1;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    /* 文字阴影增强可读性 */
}

/* 内容区域样式 */
.card-content {
    color: #333;
    font-size: 0.9em;
    line-height: 1.4;
    position: relative;
    z-index: 1;
    /* 确保内容在背景图之上 */
    padding: 1vh;
}

/* 背景图遮罩层（可选） */
.card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    /* 半透明遮罩 */
    pointer-events: none;
    /* 避免影响点击事件 */
}
</style>