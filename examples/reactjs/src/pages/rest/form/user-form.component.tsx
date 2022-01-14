import React from "react";
import { useSubmit } from "@better-typed/react-hyper-fetch";

import { patchUser, postUser } from "../server/user.api";

export const UserForm: React.FC = () => {
  const { timestamp, data, error, isSubmitting, submit } = useSubmit(
    postUser.setData({ email: "test", age: 12, name: "name" }),
  );
  const {
    timestamp: timestampPatch,
    data: dataPatch,
    error: errorPatch,
    isSubmitting: isSubmittingPatch,
    submit: submitPatch,
  } = useSubmit(patchUser.setParams({ userId: 12 }).setData({ email: "test", age: 12, name: "name" }));

  return (
    <div>
      <h3>User Form Post:</h3>
      <button type="button" onClick={() => submit()}>
        Submit Post
      </button>
      <div>
        <b>loading:</b> {String(isSubmitting)}
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
      <h3>User Form Post:</h3>
      <button type="button" onClick={() => submitPatch()}>
        Submit Patch
      </button>
      <div>
        <b>loading:</b> {String(isSubmittingPatch)}
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
    </div>
  );
};
