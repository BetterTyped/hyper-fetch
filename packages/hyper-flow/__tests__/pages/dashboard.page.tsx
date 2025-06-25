import { render, fireEvent } from "@testing-library/react";

export class TestDashboardPage {
  constructor(public component: ReturnType<typeof render>) {}

  navigation = {
    openApplications: () => {
      return fireEvent.click(this.component.getByText("Applications"));
    },
    openSettings: () => {
      return fireEvent.click(this.component.getByText("Settings"));
    },
  };

  applications = {
    getApplication: (name: string) => {
      return this.component.getByTestId(`application-link-card-${name}`);
    },
    openApplication: (name: string) => {
      return fireEvent.click(this.component.getByTestId(`application-link-card-${name}`));
    },
  };
}
