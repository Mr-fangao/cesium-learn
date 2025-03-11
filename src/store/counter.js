/*
 * @Author: liqifeng
 * @Date: 2025-03-11 11:03:35
 * @LastEditors: liqifeng Mr.undefine@protonmail.com
 * @LastEditTime: 2025-03-11 11:06:57
 * @Description: 
 */
import { defineStore } from "pinia";
import { ref } from "vue";

export const useCounterStore = defineStore("counter", () => {
  // 定义状态
  const count = ref(0); // 使用 ref 定义响应式状态

  // 定义 actions
  const increment = () => {
    count.value++;
  };

  const decrement = () => {
    count.value--;
  };

  // 暴露 state 和 actions
  return { count, increment, decrement };
});
