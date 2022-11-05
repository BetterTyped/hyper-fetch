import { githubBuilder } from "../builder";
import { RepositoryType } from "./github.types";

export const getRepositories = githubBuilder.createCommand<RepositoryType[]>()({
  endpoint: "/users/:account/repos",
  retry: 10,
  retryTime: 1000,
});

export const getRepository = githubBuilder.createCommand<RepositoryType>()({
  endpoint: "/repos/:account/:repository",
  retry: 10,
  retryTime: 1000,
});
