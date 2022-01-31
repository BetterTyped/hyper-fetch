import React, { useState } from "react";
import { QueueDumpValueType } from "@better-typed/hyper-fetch";
import { useSubmit } from "@better-typed/react-hyper-fetch";
import { useDidMount } from "@better-typed/react-lifecycle-hooks";

import { patchUser, postUser, postQueue } from "../server/user.api";

export const UserForm: React.FC = () => {
  const [queue, setQueue] = useState<QueueDumpValueType<Partial<XMLHttpRequest>>[]>([]);

  const { timestamp, data, error, submitting, submit } = useSubmit(
    postUser.setData({ email: "test", age: 12, name: "name" }),
  );
  const {
    timestamp: timestampPatch,
    data: dataPatch,
    error: errorPatch,
    submitting: submittingPatch,
    submit: submitPatch,
  } = useSubmit(patchUser.setParams({ userId: 12 }).setData({ email: "test", age: 12, name: "name" }));

  const {
    timestamp: timestampQueue,
    data: dataQueue,
    error: errorQueue,
    submitting: submittingQueue,
    submit: submitQueue,
    onSubmitSuccess,
  } = useSubmit(postQueue.setData({ id: 44, name: "queue" }));

  onSubmitSuccess(() => {
    alert("queue success");
  });

  const updateQueue = async () => {
    const newQueue = await postQueue.builder.submitQueue.get(postQueue.queueKey);
    setQueue(newQueue?.requests);
  };

  useDidMount(() => {
    const interval = setInterval(updateQueue, 100);
    return () => clearInterval(interval);
  });

  return (
    <div>
      <h3>User Form Post:</h3>
      <button type="button" onClick={() => submit()}>
        Submit Post
      </button>
      <div>
        <b>loading:</b> {String(submitting)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(error)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(data)}
      </div>
      <div>
        <b>timestamp:</b> {timestamp?.toDateString()} {timestamp?.toLocaleTimeString()}
      </div>
      <h3>User Form Patch:</h3>
      <button type="button" onClick={() => submitPatch()}>
        Submit Patch
      </button>
      <div>
        <b>loading:</b> {String(submittingPatch)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(errorPatch)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(dataPatch)}
      </div>
      <div>
        <b>timestamp:</b> {timestampPatch?.toDateString()} {timestampPatch?.toLocaleTimeString()}
      </div>
      <h3>Queued Requests:</h3>
      <button
        type="button"
        onClick={() => {
          submitQueue();
          updateQueue();
        }}
      >
        Add to queue
      </button>
      <div>
        <b>loading:</b> {String(submittingQueue)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(errorQueue)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(dataQueue)}
      </div>
      <div>
        <b>timestamp:</b> {timestampQueue?.toDateString()} {timestampQueue?.toLocaleTimeString()}
      </div>
      <div>
        <b>queue elements:</b> {queue.length}
      </div>
    </div>
  );
};
