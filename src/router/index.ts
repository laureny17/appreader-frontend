import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useEventsStore } from "@/stores/events";
import Home from "../views/Home.vue";
import About from "../views/About.vue";
import Auth from "../views/Auth.vue";
import Dashboard from "../views/Dashboard.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      meta: { requiresAuth: true, requiresEventSelection: true },
    },
    {
      path: "/about",
      name: "about",
      component: About,
    },
    {
      path: "/auth",
      name: "auth",
      component: Auth,
    },
    {
      path: "/select-event",
      name: "select-event",
      component: () => import("../components/EventSelection.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/read",
      name: "read",
      component: () => import("../views/Read.vue"),
      meta: { requiresAuth: true, requiresEventSelection: true },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/Admin.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/applications/:id",
      name: "application-detail",
      component: () => import("../views/ApplicationDetail.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const eventsStore = useEventsStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next("/auth");
    return;
  }

  // Check if route requires event selection
  if (to.meta.requiresEventSelection && !eventsStore.currentEvent) {
    next("/select-event");
    return;
  }

  // Check if route requires admin privileges
  if (to.meta.requiresAdmin && !authStore.user?.isAdmin) {
    next("/select-event");
    return;
  }

  next();
});

export default router;
