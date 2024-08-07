import { useMemo } from "react";

import { Options } from "components/options/options";
import { DevtoolsRequestEvent } from "devtools.types";
import { Back } from "./back/back";
import { getStatus, getStatusColor, RequestStatusIcon } from "utils/request.status.utils";
import { Separator } from "components/separator/separator";
import { Button } from "components/button/button";

const nameStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

const buttonsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
};

export const Details = ({ request }: { request: DevtoolsRequestEvent }) => {
  const status = useMemo(() => {
    return getStatus(request);
  }, [request]);

  const color = useMemo(() => {
    return getStatusColor(status);
  }, [status]);

  return (
    <div style={{ flex: "1 1 auto" }}>
      <Options>
        <Back />
        <Separator style={{ height: "18px", margin: "0 12px" }} />
        <div style={{ ...nameStyle, color }}>
          <RequestStatusIcon status={status} />
          {request.request.endpoint}
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div style={{ ...buttonsStyle, color }}>
          <Button color="primary">Refetch</Button>
          <Button color="tertiary">Simulate Errors</Button>
          <Button color="error">Remove</Button>
        </div>
      </Options>
      <div style={{ padding: "10px" }}>Details</div>
    </div>
  );
};
