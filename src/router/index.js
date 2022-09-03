import {
  createRouter,
  createWebHashHistory
} from "vue-router";
import CesiumContainer from "../views/CesiumContainer.vue";
import CreateEntities from "../views/CreateEntities.vue";
const routes = [{
    path: "/",
    name: "CesiumContainer",
    component: CesiumContainer,
  },
  {
    path: "/CesiumContainer",
    name: "CesiumContainer",
    component: CesiumContainer,
  },
  {
    path: "/CreateEntities",
    name: "CreateEntities",
    component: CreateEntities,
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
