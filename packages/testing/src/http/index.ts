function channelMock() {}
channelMock.prototype.onmessage = function () {};
channelMock.prototype.postMessage = function (data: any) {
  this.onmessage({ data });
};
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.BroadcastChannel = channelMock;

export * from "./http";
export * from "./http.constants";
