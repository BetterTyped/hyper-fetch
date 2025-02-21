/* eslint-disable import/no-default-export */
import { createClient } from "@hyper-fetch/core";
import { Meta, StoryObj } from "@storybook/react";
import { randEmail, randFullName, randNumber, randUuid } from "@ngneat/falso";
import { userEvent, within } from "@storybook/test";

import { Devtools } from "frontend/devtools";
import { StoryWrapper } from "./utils/story-wrapper";

const client = createClient({ url: "http://localhost:5000" });

const getUsers = client
  .createRequest<{ response: { id: string; email: string; name: string; age: number }[] }>()({
    method: "GET",
    endpoint: "/users",
  })
  .setMock(() => ({
    data: [{ id: randUuid(), email: randEmail(), name: randFullName(), age: randNumber() }],
    status: 200,
  }));

const meta: Meta<typeof Devtools> = {
  component: Devtools,
  title: "Devtools",
  tags: ["network"],
  excludeStories: /.*Devtools$/,
  args: {
    initiallyOpen: true,
  },
};

// eslint-disable-next-line import/no-default-export
export default meta;

export const Primary: StoryObj<typeof Devtools> = {
  render: (props) => (
    <StoryWrapper requests={[{ name: "Get Users", request: getUsers }]}>
      <Devtools {...props} client={client} />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const getUsersButton = canvas.getByTestId("get-users-button");

    await userEvent.click(getUsersButton);

    // await expect(canvas.getByText("/users")).toBeInTheDocument();
  },
};
