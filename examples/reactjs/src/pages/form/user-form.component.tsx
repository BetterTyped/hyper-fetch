import React from "react";
import { useSubmit, useQueue } from "@better-typed/react-hyper-fetch";

import { patchUser, postUser, postQueue } from "../server/user.api";

export const UserForm: React.FC = () => {
  // Post
  const { timestamp, data, error, submitting, submit, onSubmitSuccess, onSubmitError } = useSubmit(
    postUser.setData({ email: "test", age: 12, name: "name" }),
  );

  // Patch
  const {
    timestamp: timestampPatch,
    data: dataPatch,
    error: errorPatch,
    submitting: submittingPatch,
    submit: submitPatch,
    onSubmitSuccess: onPatchSuccess,
    onSubmitError: onPatchError,
  } = useSubmit(patchUser.setData({ email: "test", age: 12, name: "name" }));

  // Queue
  const {
    timestamp: timestampQueue,
    data: dataQueue,
    error: errorQueue,
    submitting: submittingQueue,
    submit: submitQueue,
    onSubmitSuccess: onQueueSuccess,
    onSubmitError: onQueueError,
  } = useSubmit(postQueue.setData({ id: 44, name: "queue" }));

  const { requests, stopQueue, startQueue } = useQueue(postQueue);

  // eslint-disable-next-line no-console
  onSubmitError((err) => console.log(1, err));
  // eslint-disable-next-line no-console
  onSubmitSuccess((response) => console.log(2, response));
  // eslint-disable-next-line no-console
  onPatchError((err) => console.log(1, err));
  // eslint-disable-next-line no-console
  onPatchSuccess((response) => console.log(2, response));
  // eslint-disable-next-line no-console
  onQueueError((err) => console.log(1, err));
  // eslint-disable-next-line no-console
  onQueueSuccess((response) => console.log(2, response));

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
      <button type="button" onClick={() => submitPatch({ params: { userId: 14 } })}>
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
      <button type="button" onClick={() => submitQueue()}>
        Add to queue
      </button>
      <button type="button" onClick={() => stopQueue()}>
        Stop queue
      </button>
      <button type="button" onClick={() => startQueue()}>
        Start queue
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
        <b>queue elements:</b> {requests.length}
      </div>
    </div>
  );
};
