import { render, fireEvent } from "@testing-library/react";

export class TestApplicationPage {
  constructor(public component: ReturnType<typeof render>) {}

  getPage = () => {
    return this.component.getByTestId("application-page");
  };

  navigation = {
    openApp: () => {
      return fireEvent.click(this.component.getByText("App"));
    },
    openNetwork: () => {
      return fireEvent.click(this.component.getByText("Network"));
    },
    openCache: () => {
      return fireEvent.click(this.component.getByText("Cache"));
    },
    openQueues: () => {
      return fireEvent.click(this.component.getByText("Queues"));
    },
    openSettings: () => {
      return fireEvent.click(this.component.getByText("Settings"));
    },
  };
}
