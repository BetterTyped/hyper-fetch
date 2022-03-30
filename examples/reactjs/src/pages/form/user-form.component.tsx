import React from "react";
import { useSubmit, useQueue } from "@better-typed/react-hyper-fetch";

import { patchUser, postUser, postQueue, getPublicApis } from "../server/user.api";

export const UserForm: React.FC = () => {
  // Post
  const { timestamp, data, error, submitting, submit, onSubmitSuccess, onSubmitError, onSubmitAbort } = useSubmit(
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

  const { stopped, requests, stopQueue, startQueue, stopRequest, startRequest } = useQueue(postQueue);

  // Get
  const {
    timestamp: timestampGet,
    data: dataGet,
    error: errorGet,
    submitting: submittingGet,
    submit: submitGet,
    onSubmitSuccess: onGetSuccess,
    onSubmitError: onGetError,
    onSubmitOfflineError,
  } = useSubmit(getPublicApis);

  // eslint-disable-next-line no-console
  onSubmitAbort((err) => console.log(0, err));
  // eslint-disable-next-line no-console
  onSubmitError((err) => console.log(1, err));
  // eslint-disable-next-line no-console
  onSubmitSuccess((response) => console.log(2, response));
  // eslint-disable-next-line no-console
  onPatchError((err) => console.log(3, err));
  // eslint-disable-next-line no-console
  onPatchSuccess((response) => console.log(4, response));
  // eslint-disable-next-line no-console
  onQueueError((err) => console.log(5, err));
  // eslint-disable-next-line no-console
  onQueueSuccess((response) => console.log(6, response));
  // eslint-disable-next-line no-console
  onGetError((err) => console.log(7, err));
  // eslint-disable-next-line no-console
  onGetSuccess((response) => console.log(8, response));
  // eslint-disable-next-line no-console
  onSubmitOfflineError((response) => console.log(9, response));

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
      <button type="button" onClick={() => submitPatch({ params: { userId: Math.random() } })}>
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
      {!stopped && (
        <button type="button" onClick={() => stopQueue()}>
          Stop queue
        </button>
      )}
      {stopped && (
        <button type="button" onClick={() => startQueue()}>
          Start queue
        </button>
      )}
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
        {requests.map((request) => (
          <div>
            <button
              key={request.requestId}
              type="button"
              onClick={() => (request.stopped ? startRequest(request.requestId) : stopRequest(request.requestId))}
            >
              {request.stopped ? "Start Request: " : "Stop Request: "} {request.requestId}
            </button>
          </div>
        ))}
      </div>
      <h3>Real GET request:</h3>
      <button type="button" onClick={() => submitGet()}>
        Submit GET
      </button>
      <div>
        <b>loading:</b> {String(submittingGet)}
      </div>
      <div>
        <b>error:</b> {JSON.stringify(errorGet)}
      </div>
      <div>
        <b>data:</b> {JSON.stringify(dataGet)}
      </div>
      <div>
        <b>timestamp:</b> {timestampGet?.toDateString()} {timestampGet?.toLocaleTimeString()}
      </div>
    </div>
  );
};
