import gql from "graphql-tag";

export const getUserQueryString = `
  query GetUser {
    username {
      username
      firstName
    }
  }
`;

export const getUserQuery: ReturnType<typeof gql> = gql`
  query GetUser {
    username {
      username
      firstName
    }
  }
`;

export type GetUserQueryResponse = {
  username: string;
  firstName: string;
};
