import React from "react";
import { initialFetchContextValues } from "./fetch.context.constants";
import { FetchProviderProps } from "./fetch.context.types";

export const FetchContext = React.createContext(initialFetchContextValues);

export const FetchProvider: React.FC<FetchProviderProps> = ({ client, children }) => {
  return <FetchContext.Provider value={client}>{children}</FetchContext.Provider>;
};











// Middleware

const getUsers = fetchMiddleware<UserType[]>({
  endpoint: "/api/users",
  method: "get",
  headers: {},
  isAuthenticated: false / true;
})

const postUsers = fetchMiddleware<UserType, UserData>({
  endpoint: "/api/users",
  method: "post",
  headers: {},
  isAuthenticated: false / true;
})

postUsers.setData({} as UserData)
postUsers.fetch({data: {} as UserData})




// APP

const App = () => {
  return (
    <FetchProvider>
      {...} => useFetch()
    </FetchProvider>
  )
}


const filters = "";

const {data, loading, error, onSuccess} = useFetch(getUsers.setQueryParams(filters), {dependencies: [filters]})


onSuccess((data) => {
  Notification.success(data.coś)
})