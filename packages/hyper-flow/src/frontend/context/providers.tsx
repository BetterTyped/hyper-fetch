import { PostHogProvider } from "posthog-js/react";

import { Toaster } from "@/components/ui/sonner";
import { ApplicationsProvider } from "@/context/applications/applications";

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
