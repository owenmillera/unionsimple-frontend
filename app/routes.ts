import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/grievances", "routes/dashboard.grievances.tsx"),
  route("dashboard/payments", "routes/dashboard.payments.tsx"),
  route("settings", "routes/settings.tsx"),
  route("members", "routes/members.tsx"),
  route("members/new", "routes/members.new.tsx"),
  route("members/:id/edit", "routes/members.$id.edit.tsx"),
] satisfies RouteConfig;

