export const mockXhr = () => {
  const open = jest.fn();
  const status = 0;
  const setRequestHeader = jest.fn();
  const response = JSON.stringify([
    {
      quote: "A fetched quote is as good as any quote.",
      author: "Pelle the Cat",
    },
  ]);
  const send = jest.fn();
  const abort = jest.fn();

  const xhrMockClass = () => {
    return {
      open,
      send,
      abort,
      status,
      setRequestHeader,
      response,
    };
  };

  window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass) as any;
};

export const removeMockXhr = () => {
  const open = jest.fn();
  const status = 0;
  const setRequestHeader = jest.fn();
  const response = JSON.stringify([
    {
      quote: "A fetched quote is as good as any quote.",
      author: "Pelle the Cat",
    },
  ]);
  const send = jest.fn();
  const abort = jest.fn();

  const xhrMockClass = () => {
    return {
      open,
      send,
      abort,
      status,
      setRequestHeader,
      response,
    };
  };

  window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass) as any;
};
