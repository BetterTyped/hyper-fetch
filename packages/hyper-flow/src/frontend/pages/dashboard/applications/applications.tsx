import { FolderCode } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Tutorial } from "./components/tutorial";

import { useApplications } from "@/store/applications/apps.store";
import { ApplicationCard } from "@/components/ui/application-card";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { useConnectionStore } from "@/store/applications/connection.store";

export const Applications = () => {
  const applications = useApplications((state) => state.applications);
  const connections = useConnectionStore((state) => state.connections);

  const navigate = useNavigate();

  const onOpenApplication = (applicationName: string) => {
    navigate({
      to: "/applications/$applicationName",
      params: {
        applicationName,
      },
    });
  };

  return (
    <Section id="applications" className="h-full px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          <FolderCode />
        </SectionIcon>
        <SectionTitle>Applications</SectionTitle>
        <SectionDescription>Manage your applications and connect them to your workspace.</SectionDescription>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3 mt-4">
        {Object.values(applications)
          .sort((a, b) => Number(!!connections[b.name]) - Number(!!connections[a.name]))
          .map((application) => (
            <ApplicationCard
              key={application.name}
              iconUrl=""
              {...application}
              onOpen={() => onOpenApplication(application.name)}
            />
          ))}
        <Tutorial />
      </div>
    </Section>
  );
};
