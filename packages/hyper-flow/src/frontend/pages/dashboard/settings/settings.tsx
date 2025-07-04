import { SettingsIcon } from "lucide-react";

import { PortConfiguration } from "./port-configuration";

import { Section, SectionDescription, SectionHeader, SectionIcon, SectionTitle } from "@/components/ui/section";

export const Settings = () => {
  return (
    <Section id="settings" className="flex flex-col w-full h-full flex-1 px-4 overflow-auto">
      <SectionHeader sticky>
        <SectionIcon>
          <SettingsIcon />
        </SectionIcon>
        <SectionTitle>Application Settings</SectionTitle>
        <SectionDescription>Adjust your application settings here.</SectionDescription>
      </SectionHeader>
      <PortConfiguration />
    </Section>
  );
};
