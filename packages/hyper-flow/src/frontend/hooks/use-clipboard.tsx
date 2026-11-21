export type UseClipboardOptions = {
  onSuccess?: (text: string) => void;
  /** Called when the system refuses the write, e.g. without clipboard permission */
  onError?: (error: unknown, text: string) => void;
};

export const useClipboard = ({ onSuccess, onError }: UseClipboardOptions = {}) => {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => onSuccess?.(text),
      (error: unknown) => onError?.(error, text),
    );
  };

  return { copy };
};
