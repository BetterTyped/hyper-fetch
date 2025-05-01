import { ErrorInfo } from "react";
import { RefreshCw, AlertTriangle, ArrowLeft } from "lucide-react";
import { useDidMount } from "@reins/hooks";

import { Meteors } from "../ui/meteors";
import { Button } from "../ui/button";
import { Link } from "frontend/routing/router";

export const AppError = ({ error, errorInfo }: { error: Error; errorInfo: ErrorInfo }) => {
  const handleRefresh = () => {
    window.location.reload();
  };

  useDidMount(() => {
    console.error(error, errorInfo);
  });

  return (
    <div className="h-full bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Meteors number={30} />
      </div>
      <div className="max-w-2xl w-full space-y-6">
        <div className="relative">
          <div className="relative space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>
            </div>
            <h1 className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-black to-gray-300/80 bg-clip-text text-center text-7xl font-semibold leading-none text-transparent dark:from-white dark:to-slate-900/10 pb-2">
              App crashed
            </h1>
            <p className="text-xl text-gray-400 mt-8">{error.message || "Something went wrong"}</p>
          </div>
        </div>

        <div className="rounded-lg p-6 space-y-6">
          <div className="pt-4 flex justify-center gap-2">
            <Button variant="secondary" asChild>
              <Link to="dashboard">
                <ArrowLeft className="w-4 h-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center">
          If the problem persists, please fill the bug report{" "}
          <a
            href="https://github.com/BetterTyped/hyper-fetch/issues"
            target="_blank"
            className="text-blue-500 hover:text-blue-400 transition-colors"
            rel="noreferrer"
          >
            here
          </a>
          .
        </p>
      </div>
    </div>
  );
};
