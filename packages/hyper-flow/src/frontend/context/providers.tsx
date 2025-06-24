import { PostHogProvider } from "posthog-js/react";

import { ApplicationsProvider } from "@/context/applications/applications";
import { Toaster } from "@/components/ui/sonner";

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
};
export const Providers = ({ children }: { children: React.ReactNode }) => {
  if (!import.meta.env.VITE_PUBLIC_POSTHOG_KEY) {
    return (
      <>
        <ApplicationsProvider>{children}</ApplicationsProvider>
        <Toaster />
      </>
    );
  }

  return (
    <PostHogProvider apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY} options={options}>
      <ApplicationsProvider>{children}</ApplicationsProvider>
      <Toaster />
    </PostHogProvider>
  );
};
