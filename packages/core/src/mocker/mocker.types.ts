import { RequestInstance } from "../request";

export type RequestMockType<Response> = {
  data: Response | Response[] | (() => Response);
  status?: number | string;
  success?: boolean;

  config?: {
    timeout?: boolean;
    requestTime?: number;
    responseTime?: number;
    totalUploaded?: number;
    totalDownloaded?: number;
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
