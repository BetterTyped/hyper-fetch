import { SettingsIcon } from "lucide-react";

import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "frontend/components/ui/section";

export const Settings = () => {
  return (
    <Section id="settings" className="flex flex-col w-full h-full flex-1">
      <SectionHeader>
        <SectionIcon>
          <SettingsIcon />
        </SectionIcon>
        <SectionTitle>Application Settings</SectionTitle>
        <SectionDescription>Adjust your application settings here.</SectionDescription>
      </SectionHeader>
      <div>Settings</div>
    </Section>
  );
};
