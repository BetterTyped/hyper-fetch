import { QueuesList } from "./list/queues.list";
import { QueuesDetails } from "./details/queues.details";
import { Content } from "frontend/components/content/content";
import { ProjectLayout } from "../_layout/layout";

export const Queues = () => {
  return (
    <ProjectLayout>
      <Content>
        <QueuesList />
        <QueuesDetails />
      </Content>
    </ProjectLayout>
  );
};
