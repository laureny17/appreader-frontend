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
      path: "/admin/event/:id",
      name: "event-config",
      component: () => import("../views/EventConfiguration.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/admin/create-event",
      name: "create-event",
      component: () => import("../views/CreateEvent.vue"),
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

  // Check if route requires admin privileges
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    // If user is not admin, redirect to event selection
    next("/select-event");
    return;
  }

  // If user is admin and trying to access event selection, redirect to admin page (unless in reader view)
  if (
    to.name === "select-event" &&
    authStore.isAdmin &&
    authStore.isAdminView
  ) {
    next("/admin");
    return;
  }

  // Check if route requires event selection (for non-admin users)
  if (
    to.meta.requiresEventSelection &&
    !eventsStore.currentEvent &&
    !authStore.isAdmin
  ) {
    next("/select-event");
    return;
  }

  next();
});

export default router;
