import { createRouter, createWebHashHistory } from "vue-router";

import routes from "./routes.js";

import { useAuthStore } from "../store/auth.store.js";



const router = createRouter({

  history: createWebHashHistory(),

  routes,

  scrollBehavior() {

​    return { left: 0, top: 0 };

  }

});



router.beforeEach((to) => {

  const auth = useAuthStore();

  const isAuthRoute = to.path.startsWith("/auth");

  if (!isAuthRoute && !auth.isAuthed) return "/auth/login";

  if (isAuthRoute && auth.isAuthed) return "/app/command";

});



export default router;