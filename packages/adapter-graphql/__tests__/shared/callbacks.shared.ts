export const testCallbacksExecution = (callbacks: Array<jest.Mock<any, any>>) => {
  callbacks.forEach((spyFn, index) => {
    const nextSpy = callbacks[index + 1];
    if (nextSpy) {
      expect(spyFn).toHaveBeenCalledBefore(nextSpy);
    }
    expect(spyFn).toHaveBeenCalledTimes(1);
  });
};
