import { client } from "./client";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  company: { name: string };
};

export type SortField = "firstName" | "email" | "age";
export type SortOrder = "asc" | "desc";
export type UsersQuery = { limit: number; skip: number; sortBy: SortField; order: SortOrder; select: string };

/** Sorting and paging happen on the server: the query params are the whole table state. */
export const getUsers = client.createRequest<{
  response: { users: User[]; total: number; skip: number; limit: number };
  queryParams: UsersQuery;
}>()({
  endpoint: "/users",
});

export const PAGE_SIZE = 8;
export const usersPage = (page: number, sortBy: SortField, order: SortOrder) =>
  getUsers.setQueryParams({
    limit: PAGE_SIZE,
    skip: page * PAGE_SIZE,
    sortBy,
    order,
    // `select` is a dummyjson query param: the API returns only these fields.
    select: "firstName,lastName,email,age,company",
  });
