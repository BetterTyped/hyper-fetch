import { RequestInstance } from "../request";

export type RequestMockType<Response> = {
  data: Response | Response[] | (() => Response);
  config?: {
    status?: number | string;
    success?: boolean;
    responseDelay?: number;
    requestSentDuration?: number;
    responseReceivedDuration?: number;
  };
  extra?: any;
};

export type RequestDataMockTypes<Response, Request extends RequestInstance> =
  | RequestMockType<Response>
  | RequestMockType<Response>[]
  | ((r: Request) => RequestMockType<Response>)
  | ((r: Request) => RequestMockType<Response>)[]
  | ((r: Request) => Promise<RequestMockType<Response>>)
  | ((r: Request) => Promise<RequestMockType<Response>>)[];

export type GeneratorReturnMockTypes<Response, Request extends RequestInstance> =
  | RequestMockType<Response>
  | ((r: Request) => RequestMockType<Response>)
  | ((r: Request) => Promise<RequestMockType<Response>>);
