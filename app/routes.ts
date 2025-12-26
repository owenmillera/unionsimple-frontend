import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("signin", "routes/signin.tsx"),
  route("signup", "routes/signup.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("union/:slug", "routes/union.$slug.tsx"),
  route("union/:slug/grievances", "routes/union.$slug.grievances.tsx"),
  route("union/:slug/payments", "routes/union.$slug.payments.tsx"),
  route("union/:slug/members", "routes/union.$slug.members.tsx"),
  route("union/:slug/members/new", "routes/union.$slug.members.new.tsx"),
  route("union/:slug/members/:id/edit", "routes/union.$slug.members.$id.edit.tsx"),
  route("union/:slug/settings", "routes/union.$slug.settings.tsx"),
  route("settings", "routes/settings.tsx"),
] satisfies RouteConfig;

