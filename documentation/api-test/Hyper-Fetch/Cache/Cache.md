# Cache

Cache class should be initialized per every command instance(not modified with params or queryParams). This way we
create container which contains different requests to the same endpoint. With this segregation of data we can keep
paginated data, filtered data, without overriding it between not related fetches. Key for interactions should be
generated later in the hooks with getCommandKey util function, which joins the stringified values to create isolated
space.

Cache class should be initialized per every command instance(not modified with params or queryParams). This way we
create container which contains different requests to the same endpoint. With this segregation of data we can keep
paginated data, filtered data, without overriding it between not related fetches. Key for interactions should be
generated later in the hooks with getCommandKey util function, which joins the stringified values to create isolated
space.

## Parameters

| test | test | test | test | test |
| ---- | ---- | ---- | ---- | ---- |
| 1    | 1    | 1    | 1    | 1    |
| 1    | 1    | 1    | 1    | 1    |
