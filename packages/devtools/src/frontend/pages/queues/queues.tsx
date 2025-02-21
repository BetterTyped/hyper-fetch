import { QueuesToolbar } from "./toolbar/queues.toolbar";
import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { Body } from "frontend/components/body/body";
import { Content } from "frontend/components/content/content";

export const Queues = () => {
  return (
    <Body>
      <QueuesToolbar />
      <Content>
        <QueuesList />
        <QueuesDetails />
      </Content>
    </Body>
  );
};
