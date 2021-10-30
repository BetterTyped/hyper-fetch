import { FetchBuilder } from "@better-typed/react-fetch";

export const middleware = new FetchBuilder({ baseUrl: "http://localhost:5555" }).build();
