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
