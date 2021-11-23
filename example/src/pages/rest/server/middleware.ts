import { FetchBuilder } from "@better-typed/react-fetch";

export const restMiddleware = new FetchBuilder({ baseUrl: "http://localhost:5000" }).build();
