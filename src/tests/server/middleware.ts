import { FetchBuilder } from "middleware/fetch.builder";

export const middleware = new FetchBuilder({ baseUrl: "http://localhost:3000" }).build();
