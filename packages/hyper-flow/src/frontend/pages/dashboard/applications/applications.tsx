import { useNavigate } from "@tanstack/react-router";
import { FolderCode } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Tutorial } from "./components/tutorial";
import { ApplicationCard } from "@/components/ui/application-card";
import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";
import { useApplications } from "@/store/applications/apps.store";
import { useConnectionStore } from "@/store/applications/connection.store";

export const Applications = () => {
  const applications = useApplications((state) => state.applications);
  // The connection store updates entries in place, so select the flags themselves to re-sort on every change.
  const connected = useConnectionStore(
    useShallow((state) =>
      Object.fromEntries(Object.entries(state.connections).map(([name, connection]) => [name, connection.connected])),
    ),
  );

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
        <SectionDescription>Applications that connected to HyperFlow through the devtools plugin.</SectionDescription>
      </SectionHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3 mt-4">
        {Object.values(applications)
          .toSorted((a, b) => Number(!!connected[b.name]) - Number(!!connected[a.name]))
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
