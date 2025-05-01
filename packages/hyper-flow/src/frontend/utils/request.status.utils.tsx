import { DevtoolsRequestEvent } from "frontend/context/projects/types";
import { cn } from "frontend/lib/utils";

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

export const getStatusColor = (status: Status, isLight: boolean): string => {
  switch (status) {
    case Status.REMOVED:
      return isLight ? "text-gray-600" : "text-gray-700";
    case Status.CANCELED:
      return isLight ? "text-orange-500" : "text-orange-400";
    case Status.FAILED:
      return isLight ? "text-red-500" : "text-red-400";
    case Status.IN_PROGRESS:
      return isLight ? "text-blue-400" : "text-blue-200";
    default:
      return "text-inherit";
  }
};

export const RequestStatusIcon = ({ status, className }: { status: Status; className?: string }) => {
  const getIconColor = () => {
    switch (status) {
      case Status.REMOVED:
        return "#9e9e9e"; // gray-400
      case Status.CANCELED:
        return "#f97316"; // orange-500
      case Status.FAILED:
        return "#ef4444"; // red-500
      case Status.SUCCESS:
        return "#22c55e"; // green-500
      case Status.IN_PROGRESS:
        return "#3b82f6"; // blue-500
      default:
        return "currentColor";
    }
  };

  const baseClassName = "w-5 h-5";

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
          className={cn(baseClassName, className)}
        >
          <g>
            <g>
              <path
                fill={getIconColor()}
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
                fill={getIconColor()}
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
          className={cn(baseClassName, className)}
        >
          <path
            fill={getIconColor()}
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
          className={cn(baseClassName, className)}
        >
          <ellipse fill={getIconColor()} cx="256" cy="256" rx="256" ry="255.832" />
          <g transform="matrix(-0.7071 0.7071 -0.7071 -0.7071 77.26 32)">
            <rect x="3.98" y="-427.615" fill="#fff" width="55.992" height="285.672" />
            <rect x="-110.828" y="-312.815" fill="#fff" width="285.672" height="55.992" />
          </g>
        </svg>
      );
    case Status.SUCCESS:
      return (
        <svg
          viewBox="6 6 50 50"
          xmlns="http://www.w3.org/2000/svg"
          id="fi_6276686"
          className={cn(baseClassName, className)}
        >
          <g id="Checkmark">
            <path
              d="m32 8a24 24 0 1 0 24 24 24.03187 24.03187 0 0 0 -24-24zm13.41 17.41-15 15a1.97983 1.97983 0 0 1 -2.82 0l-7-7a1.994 1.994 0 0 1 2.82-2.82l5.59 5.58 13.59-13.58a1.994 1.994 0 0 1 2.82 2.82z"
              fill={getIconColor()}
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
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className={cn(baseClassName, "animate-spin", className)}
        >
          <path
            fill={getIconColor()}
            d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
            opacity=".25"
          />
          <path
            fill={getIconColor()}
            d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
          />
        </svg>
      );
    default:
      return null;
  }
};
