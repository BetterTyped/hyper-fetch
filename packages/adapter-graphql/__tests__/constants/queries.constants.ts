import gql from "graphql-tag";

export const getUserQuery = gql`
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
