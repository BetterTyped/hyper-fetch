import { DevtoolsRequestEvent } from "devtools.types";
import { tokens } from "theme/tokens";

export enum Status {
  REMOVED = "Removed",
  CANCELED = "Canceled",
  SUCCESS = "Success",
  FAILED = "Failed",
  IN_PROGRESS = "In progress",
  PAUSED = "Paused",
}

export const getStatus = (
  item: Pick<DevtoolsRequestEvent, "isRemoved" | "isCanceled" | "isFinished" | "isSuccess">,
): Status => {
  if (!item) {
    return Status.REMOVED;
  }

  if (item.isRemoved) {
    return Status.REMOVED;
  }
  if (item.isCanceled) {
    return Status.CANCELED;
  }
  if (item.isFinished) {
    return item.isSuccess ? Status.SUCCESS : Status.FAILED;
  }
  return Status.IN_PROGRESS;
};

export const getStatusColor = (status: Status, isLight: boolean) => {
  switch (status) {
    case Status.REMOVED:
      return isLight ? tokens.colors.light[600] : tokens.colors.light[700];
    case Status.CANCELED:
      return isLight ? tokens.colors.orange[500] : tokens.colors.orange[400];
    case Status.FAILED:
      return isLight ? tokens.colors.red[500] : tokens.colors.red[400];
    case Status.IN_PROGRESS:
      return isLight ? tokens.colors.blue[500] : tokens.colors.blue[400];
    default:
      return "inherit";
  }
};

export const RequestStatusIcon = ({ status }: { status: Status }) => {
  switch (status) {
    case Status.REMOVED:
      return (
        <svg
          version="1.1"
          id="fi_542724"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          xmlSpace="preserve"
          width="14px"
          height="14px"
        >
          <g>
            <g>
              <path
                fill="#9e9e9e"
                d="M436,60h-89.185l-9.75-29.238C330.927,12.363,313.773,0,294.379,0h-76.758c-19.395,0-36.548,12.363-42.7,30.762
          L165.182,60H76c-24.814,0-45,20.186-45,45v30c0,16.708,15.041,15,31.183,15c138.554,0,264.175,0,403.817,0c8.291,0,15-6.709,15-15
          v-30C481,80.186,460.814,60,436,60z M196.813,60l6.57-19.746C205.434,34.116,211.161,30,217.621,30h76.758
          c6.46,0,12.188,4.116,14.224,10.254L315.18,60H196.813z"
              />
            </g>
          </g>
          <g>
            <g>
              <path
                fill="#9e9e9e"
                d="M64.666,182l23.917,289.072C90.707,494.407,109.97,512,133.393,512h245.215c23.423,0,42.686-17.593,44.824-41.06
          L447.336,182H64.666z M181,437c0,19.773-30,19.854-30,0V227c0-19.773,30-19.854,30,0V437z M271,437c0,19.773-30,19.854-30,0V227
          c0-19.773,30-19.854,30,0V437z M361,437c0,19.773-30,19.854-30,0V227c0-8.291,6.709-15,15-15c8.291,0,15,6.709,15,15V437z"
              />
            </g>
          </g>
        </svg>
      );
    case Status.CANCELED:
      return (
        <svg
          version="1.1"
          id="fi_718672"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 468.293 468.293"
          xmlSpace="preserve"
          width="14px"
          height="14px"
        >
          <path
            fill={tokens.colors.orange[500]}
            d="M234.146,0C104.898,0,0,104.898,0,234.146s104.898,234.146,234.146,234.146
      s234.146-104.898,234.146-234.146S363.395,0,234.146,0z M66.185,234.146c0-93.034,75.551-168.585,167.961-168.585
      c34.966,0,68.059,10.615,94.907,29.346L95.532,329.054C76.8,302.205,66.185,269.112,66.185,234.146z M234.146,402.107
      c-34.966,0-68.059-10.615-94.907-29.346l233.522-233.522c18.732,26.849,29.346,59.941,29.346,94.907
      C402.107,327.18,327.18,402.107,234.146,402.107z"
          />
        </svg>
      );
    case Status.FAILED:
      return (
        <svg
          version="1.1"
          id="fi_463612"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 512 512"
          xmlSpace="preserve"
          width="14px"
          height="14px"
        >
          <ellipse fill={tokens.colors.red[500]} cx="256" cy="256" rx="256" ry="255.832" />
          <g transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 77.26 32)">
            <rect x="3.98" y="-427.615" fill="#fff" width="55.992" height="285.672" />
            <rect x="-110.828" y="-312.815" fill="#fff" width="285.672" height="55.992" />
          </g>
        </svg>
      );
    case Status.SUCCESS:
      return (
        <svg viewBox="6 6 50 50" xmlns="http://www.w3.org/2000/svg" id="fi_6276686" width="14px" height="14px">
          <g id="Checkmark">
            <path
              d="m32 8a24 24 0 1 0 24 24 24.03187 24.03187 0 0 0 -24-24zm13.41 17.41-15 15a1.97983 1.97983 0 0 1 -2.82 0l-7-7a1.994 1.994 0 0 1 2.82-2.82l5.59 5.58 13.59-13.58a1.994 1.994 0 0 1 2.82 2.82z"
              fill={tokens.colors.green[500]}
            />
            <path
              d="m45.41 25.41-15 15a1.97983 1.97983 0 0 1 -2.82 0l-7-7a1.994 1.994 0 0 1 2.82-2.82l5.59 5.58 13.59-13.58a1.994 1.994 0 0 1 2.82 2.82z"
              fill="#fff"
            />
          </g>
        </svg>
      );
    case Status.IN_PROGRESS:
      return (
        <svg
          version="1.1"
          id="fi_179407"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 286.052 286.052"
          xmlSpace="preserve"
          width="14px"
          height="14px"
        >
          <g>
            <path
              fill={tokens.colors.blue[500]}
              d="M78.493,143.181H62.832v-0.125c0-43.623,34.809-80.328,79.201-80.122
      c21.642,0.098,41.523,8.841,55.691,23.135l25.843-24.931c-20.864-21.043-49.693-34.049-81.534-34.049
      c-63.629,0-115.208,51.955-115.298,116.075h-15.84c-9.708,0-13.677,6.49-8.823,14.437l33.799,33.504
      c6.704,6.704,10.736,6.91,17.646,0l33.799-33.504C92.17,149.662,88.192,143.181,78.493,143.181z M283.978,129.236l-33.799-33.433
      c-6.892-6.892-11.156-6.481-17.637,0l-33.799,33.433c-4.854,7.929-0.894,14.419,8.814,14.419h15.635
      c-0.25,43.337-34.943,79.72-79.183,79.514c-21.633-0.089-41.505-8.814-55.691-23.099l-25.843,24.896
      c20.873,21.007,49.702,33.996,81.534,33.996c63.432,0,114.869-51.579,115.28-115.298h15.867
      C284.872,143.655,288.832,137.156,283.978,129.236z"
            />
          </g>
        </svg>
      );
    default:
      return null;
  }
};
