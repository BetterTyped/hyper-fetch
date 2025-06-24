import { useState } from "react";
import { useIsMounted } from "@better-hooks/lifecycle";
import { Copy } from "lucide-react";

export type UseClipboardOptions = {
  onSuccess?: (text: string) => void;
  onError?: (error: Error, text: string) => void;
};

export const useClipboard = (options?: UseClipboardOptions) => {
  const { onSuccess, onError } = options || {};

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        onSuccess?.(text);
      },
      (error) => {
        onError?.(error, text);
      },
    );
  };

  return {
    copy: handleCopy,
  };
};

export const NpmInstall = ({ pkg }: { pkg: string }) => {
  const isMounted = useIsMounted();
  const [done, setDone] = useState(false);

  const { copy } = useClipboard({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        if (isMounted) {
          setDone(false);
        }
      }, 1000);
    },
    onError: () => {},
  });

  return (
    <div className="relative mb-10 w-fit">
      <button
        type="button"
        onClick={() => copy(`npm i ${pkg}`)}
        className="group btn-sm inline-flex items-center !px-5 !py-3 w-fit shiny-btn"
      >
        <span className="group-hover:dark:text-white group-hover:text-black transition duration-150 ease-in-out">
          npm i<b className="ml-1">{pkg}</b>{" "}
        </span>
        <Copy className="w-[15px] ml-2 fill-yellow-500 transition duration-150 ease-in-out" />
      </button>
      <button
        type="button"
        onClick={() => copy(`yarn add ${pkg}`)}
        className="group btn-sm inline-flex items-center !px-5 !py-3 w-fit shiny-btn ml-2"
      >
        <span className="group-hover:dark:text-white group-hover:text-black transition duration-150 ease-in-out">
          yarn add
          <b className="ml-1">{pkg}</b>{" "}
        </span>
        <Copy className="w-[15px] ml-2 fill-yellow-500 transition duration-150 ease-in-out" />
      </button>
      {done && (
        <div className="absolute -bottom-2 translate-y-full left-1/2 -translate-x-1/2 text-xs opacity-60 ml-2 whitespace-nowrap">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};
