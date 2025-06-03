import React from "react";
import { Ban, Pause, Trash, WifiOff, X } from "lucide-react";

import { TinyLoader } from "../../tiny-loader";

interface QueueStatusIconProps {
  status: string;
}

export const QueueStatusIcon: React.FC<QueueStatusIconProps> = ({ status }) => {
  if (status === "Uploading" || status === "Downloading") {
    return <TinyLoader />;
  }
  if (status === "Stopped") {
    return <Pause className="w-4 h-4 text-white" />;
  }
  if (status === "Offline") {
    return <WifiOff className="w-4 h-4 text-white" />;
  }
  if (status === "Completed") {
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (status === "Failed") {
    return <X className="w-4 h-4 text-red-500" />;
  }
  if (status === "Canceled") {
    return <Ban className="w-4 h-4 text-yellow-500" />;
  }
  if (status === "Removed") {
    return <Trash className="w-4 h-4 text-white" />;
  }
  return (
    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
};
