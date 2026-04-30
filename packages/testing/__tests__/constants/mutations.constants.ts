import gql from "graphql-tag";

export const loginMutation: ReturnType<typeof gql> = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      username
      password
    }
  }
`;

export type LoginMutationVariables = {
  username: string;
  password: string;
};
