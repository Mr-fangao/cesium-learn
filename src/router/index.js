import {
  createRouter,
  createWebHashHistory
} from "vue-router";
import CesiumContainer from "../views/CesiumContainer.vue";
import CreateEntities from "../views/CreateEntities.vue";
import CreateModels from "../views/CreateModels.vue";
import InitPage from "../views/InitPage.vue";
const routes = [{
    path: "/",
    name: "Init",
    component: InitPage,
  },
  {
    path: "/InitPage",
    name: "InitPage",
    component: InitPage,
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
  },
  {
    path: "/CreateModels",
    name: "CreateModels",
    component: CreateModels,
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
