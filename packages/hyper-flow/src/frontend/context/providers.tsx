import { PostHogProvider } from "posthog-js/react";

import { ProjectsProvider } from "frontend/context/projects/projects";
import { Toaster } from "frontend/components/ui/sonner";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <ProjectsProvider>{children}</ProjectsProvider>
      <Toaster />
    </PostHogProvider>
  );
};
