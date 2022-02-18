export const useSubmitDefaultOptions = {
  disabled: false, // disables submitting possibility
  dependencyTracking: true, // if true -> accessors rerender only when used. If false -> rerenders on every change
  cacheOnMount: true, // should use data from cache (?) on initialization - to be checked whether is useful
  initialData: null,
  debounce: false,
  debounceTime: 400, // milliseconds
  suspense: false, // TBD
  shouldThrow: false, // TBD
  invalidate: [],
};
