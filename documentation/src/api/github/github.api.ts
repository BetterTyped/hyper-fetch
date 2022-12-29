import { githubClient } from "../client";
import { RepositoryType } from "./github.types";

export const getRepositories = githubClient.createRequest<RepositoryType[]>()({
  endpoint: "/users/:account/repos",
  retry: 10,
  retryTime: 1000,
});

export const getRepository = githubClient.createRequest<RepositoryType>()({
  endpoint: "/repos/:account/:repository",
  retry: 10,
  retryTime: 1000,
});
