/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Auto-generated stress test — 500 typed requests
import { createClient } from "../../src";

const client = createClient({ url: "https://api.test.com" });

const req0 = client.createRequest<{
  response: { id: number; name: string; index: 0 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req1 = client.createRequest<{
  response: { id: number; name: string; index: 1 };
  payload: { value: string; count: 1 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req2 = client.createRequest<{
  response: { id: number; name: string; index: 2 };
  payload: { value: string; count: 2 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req3 = client.createRequest<{
  response: { id: number; name: string; index: 3 };
  payload: { value: string; count: 3 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req4 = client.createRequest<{ response: { id: number; name: string; index: 4 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req5 = client.createRequest<{ response: { id: number; name: string; index: 5 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req6 = client.createRequest<{
  response: { id: number; name: string; index: 6 };
  payload: { value: string; count: 6 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req7 = client.createRequest<{
  response: { id: number; name: string; index: 7 };
  payload: { value: string; count: 7 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req8 = client.createRequest<{
  response: { id: number; name: string; index: 8 };
  payload: { value: string; count: 8 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req9 = client.createRequest<{
  response: { id: number; name: string; index: 9 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req10 = client.createRequest<{ response: { id: number; name: string; index: 10 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req11 = client.createRequest<{
  response: { id: number; name: string; index: 11 };
  payload: { value: string; count: 11 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req12 = client.createRequest<{
  response: { id: number; name: string; index: 12 };
  payload: { value: string; count: 12 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req13 = client.createRequest<{
  response: { id: number; name: string; index: 13 };
  payload: { value: string; count: 13 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req14 = client.createRequest<{ response: { id: number; name: string; index: 14 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req15 = client.createRequest<{
  response: { id: number; name: string; index: 15 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req16 = client.createRequest<{
  response: { id: number; name: string; index: 16 };
  payload: { value: string; count: 16 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req17 = client.createRequest<{
  response: { id: number; name: string; index: 17 };
  payload: { value: string; count: 17 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req18 = client.createRequest<{
  response: { id: number; name: string; index: 18 };
  payload: { value: string; count: 18 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req19 = client.createRequest<{ response: { id: number; name: string; index: 19 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req20 = client.createRequest<{ response: { id: number; name: string; index: 20 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req21 = client.createRequest<{
  response: { id: number; name: string; index: 21 };
  payload: { value: string; count: 21 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req22 = client.createRequest<{
  response: { id: number; name: string; index: 22 };
  payload: { value: string; count: 22 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req23 = client.createRequest<{
  response: { id: number; name: string; index: 23 };
  payload: { value: string; count: 23 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req24 = client.createRequest<{
  response: { id: number; name: string; index: 24 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req25 = client.createRequest<{ response: { id: number; name: string; index: 25 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req26 = client.createRequest<{
  response: { id: number; name: string; index: 26 };
  payload: { value: string; count: 26 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req27 = client.createRequest<{
  response: { id: number; name: string; index: 27 };
  payload: { value: string; count: 27 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req28 = client.createRequest<{
  response: { id: number; name: string; index: 28 };
  payload: { value: string; count: 28 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req29 = client.createRequest<{ response: { id: number; name: string; index: 29 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req30 = client.createRequest<{
  response: { id: number; name: string; index: 30 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req31 = client.createRequest<{
  response: { id: number; name: string; index: 31 };
  payload: { value: string; count: 31 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req32 = client.createRequest<{
  response: { id: number; name: string; index: 32 };
  payload: { value: string; count: 32 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req33 = client.createRequest<{
  response: { id: number; name: string; index: 33 };
  payload: { value: string; count: 33 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req34 = client.createRequest<{ response: { id: number; name: string; index: 34 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req35 = client.createRequest<{ response: { id: number; name: string; index: 35 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req36 = client.createRequest<{
  response: { id: number; name: string; index: 36 };
  payload: { value: string; count: 36 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req37 = client.createRequest<{
  response: { id: number; name: string; index: 37 };
  payload: { value: string; count: 37 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req38 = client.createRequest<{
  response: { id: number; name: string; index: 38 };
  payload: { value: string; count: 38 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req39 = client.createRequest<{
  response: { id: number; name: string; index: 39 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req40 = client.createRequest<{ response: { id: number; name: string; index: 40 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req41 = client.createRequest<{
  response: { id: number; name: string; index: 41 };
  payload: { value: string; count: 41 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req42 = client.createRequest<{
  response: { id: number; name: string; index: 42 };
  payload: { value: string; count: 42 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req43 = client.createRequest<{
  response: { id: number; name: string; index: 43 };
  payload: { value: string; count: 43 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req44 = client.createRequest<{ response: { id: number; name: string; index: 44 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req45 = client.createRequest<{
  response: { id: number; name: string; index: 45 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req46 = client.createRequest<{
  response: { id: number; name: string; index: 46 };
  payload: { value: string; count: 46 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req47 = client.createRequest<{
  response: { id: number; name: string; index: 47 };
  payload: { value: string; count: 47 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req48 = client.createRequest<{
  response: { id: number; name: string; index: 48 };
  payload: { value: string; count: 48 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req49 = client.createRequest<{ response: { id: number; name: string; index: 49 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req50 = client.createRequest<{ response: { id: number; name: string; index: 50 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req51 = client.createRequest<{
  response: { id: number; name: string; index: 51 };
  payload: { value: string; count: 51 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req52 = client.createRequest<{
  response: { id: number; name: string; index: 52 };
  payload: { value: string; count: 52 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req53 = client.createRequest<{
  response: { id: number; name: string; index: 53 };
  payload: { value: string; count: 53 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req54 = client.createRequest<{
  response: { id: number; name: string; index: 54 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req55 = client.createRequest<{ response: { id: number; name: string; index: 55 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req56 = client.createRequest<{
  response: { id: number; name: string; index: 56 };
  payload: { value: string; count: 56 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req57 = client.createRequest<{
  response: { id: number; name: string; index: 57 };
  payload: { value: string; count: 57 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req58 = client.createRequest<{
  response: { id: number; name: string; index: 58 };
  payload: { value: string; count: 58 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req59 = client.createRequest<{ response: { id: number; name: string; index: 59 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req60 = client.createRequest<{
  response: { id: number; name: string; index: 60 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req61 = client.createRequest<{
  response: { id: number; name: string; index: 61 };
  payload: { value: string; count: 61 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req62 = client.createRequest<{
  response: { id: number; name: string; index: 62 };
  payload: { value: string; count: 62 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req63 = client.createRequest<{
  response: { id: number; name: string; index: 63 };
  payload: { value: string; count: 63 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req64 = client.createRequest<{ response: { id: number; name: string; index: 64 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req65 = client.createRequest<{ response: { id: number; name: string; index: 65 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req66 = client.createRequest<{
  response: { id: number; name: string; index: 66 };
  payload: { value: string; count: 66 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req67 = client.createRequest<{
  response: { id: number; name: string; index: 67 };
  payload: { value: string; count: 67 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req68 = client.createRequest<{
  response: { id: number; name: string; index: 68 };
  payload: { value: string; count: 68 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req69 = client.createRequest<{
  response: { id: number; name: string; index: 69 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req70 = client.createRequest<{ response: { id: number; name: string; index: 70 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req71 = client.createRequest<{
  response: { id: number; name: string; index: 71 };
  payload: { value: string; count: 71 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req72 = client.createRequest<{
  response: { id: number; name: string; index: 72 };
  payload: { value: string; count: 72 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req73 = client.createRequest<{
  response: { id: number; name: string; index: 73 };
  payload: { value: string; count: 73 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req74 = client.createRequest<{ response: { id: number; name: string; index: 74 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req75 = client.createRequest<{
  response: { id: number; name: string; index: 75 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req76 = client.createRequest<{
  response: { id: number; name: string; index: 76 };
  payload: { value: string; count: 76 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req77 = client.createRequest<{
  response: { id: number; name: string; index: 77 };
  payload: { value: string; count: 77 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req78 = client.createRequest<{
  response: { id: number; name: string; index: 78 };
  payload: { value: string; count: 78 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req79 = client.createRequest<{ response: { id: number; name: string; index: 79 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req80 = client.createRequest<{ response: { id: number; name: string; index: 80 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req81 = client.createRequest<{
  response: { id: number; name: string; index: 81 };
  payload: { value: string; count: 81 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req82 = client.createRequest<{
  response: { id: number; name: string; index: 82 };
  payload: { value: string; count: 82 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req83 = client.createRequest<{
  response: { id: number; name: string; index: 83 };
  payload: { value: string; count: 83 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req84 = client.createRequest<{
  response: { id: number; name: string; index: 84 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req85 = client.createRequest<{ response: { id: number; name: string; index: 85 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req86 = client.createRequest<{
  response: { id: number; name: string; index: 86 };
  payload: { value: string; count: 86 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req87 = client.createRequest<{
  response: { id: number; name: string; index: 87 };
  payload: { value: string; count: 87 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req88 = client.createRequest<{
  response: { id: number; name: string; index: 88 };
  payload: { value: string; count: 88 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req89 = client.createRequest<{ response: { id: number; name: string; index: 89 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req90 = client.createRequest<{
  response: { id: number; name: string; index: 90 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req91 = client.createRequest<{
  response: { id: number; name: string; index: 91 };
  payload: { value: string; count: 91 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req92 = client.createRequest<{
  response: { id: number; name: string; index: 92 };
  payload: { value: string; count: 92 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req93 = client.createRequest<{
  response: { id: number; name: string; index: 93 };
  payload: { value: string; count: 93 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req94 = client.createRequest<{ response: { id: number; name: string; index: 94 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req95 = client.createRequest<{ response: { id: number; name: string; index: 95 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req96 = client.createRequest<{
  response: { id: number; name: string; index: 96 };
  payload: { value: string; count: 96 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req97 = client.createRequest<{
  response: { id: number; name: string; index: 97 };
  payload: { value: string; count: 97 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req98 = client.createRequest<{
  response: { id: number; name: string; index: 98 };
  payload: { value: string; count: 98 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req99 = client.createRequest<{
  response: { id: number; name: string; index: 99 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req100 = client.createRequest<{ response: { id: number; name: string; index: 100 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req101 = client.createRequest<{
  response: { id: number; name: string; index: 101 };
  payload: { value: string; count: 101 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req102 = client.createRequest<{
  response: { id: number; name: string; index: 102 };
  payload: { value: string; count: 102 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req103 = client.createRequest<{
  response: { id: number; name: string; index: 103 };
  payload: { value: string; count: 103 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req104 = client.createRequest<{ response: { id: number; name: string; index: 104 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req105 = client.createRequest<{
  response: { id: number; name: string; index: 105 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req106 = client.createRequest<{
  response: { id: number; name: string; index: 106 };
  payload: { value: string; count: 106 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req107 = client.createRequest<{
  response: { id: number; name: string; index: 107 };
  payload: { value: string; count: 107 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req108 = client.createRequest<{
  response: { id: number; name: string; index: 108 };
  payload: { value: string; count: 108 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req109 = client.createRequest<{ response: { id: number; name: string; index: 109 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req110 = client.createRequest<{ response: { id: number; name: string; index: 110 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req111 = client.createRequest<{
  response: { id: number; name: string; index: 111 };
  payload: { value: string; count: 111 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req112 = client.createRequest<{
  response: { id: number; name: string; index: 112 };
  payload: { value: string; count: 112 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req113 = client.createRequest<{
  response: { id: number; name: string; index: 113 };
  payload: { value: string; count: 113 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req114 = client.createRequest<{
  response: { id: number; name: string; index: 114 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req115 = client.createRequest<{ response: { id: number; name: string; index: 115 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req116 = client.createRequest<{
  response: { id: number; name: string; index: 116 };
  payload: { value: string; count: 116 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req117 = client.createRequest<{
  response: { id: number; name: string; index: 117 };
  payload: { value: string; count: 117 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req118 = client.createRequest<{
  response: { id: number; name: string; index: 118 };
  payload: { value: string; count: 118 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req119 = client.createRequest<{ response: { id: number; name: string; index: 119 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req120 = client.createRequest<{
  response: { id: number; name: string; index: 120 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req121 = client.createRequest<{
  response: { id: number; name: string; index: 121 };
  payload: { value: string; count: 121 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req122 = client.createRequest<{
  response: { id: number; name: string; index: 122 };
  payload: { value: string; count: 122 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req123 = client.createRequest<{
  response: { id: number; name: string; index: 123 };
  payload: { value: string; count: 123 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req124 = client.createRequest<{ response: { id: number; name: string; index: 124 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req125 = client.createRequest<{ response: { id: number; name: string; index: 125 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req126 = client.createRequest<{
  response: { id: number; name: string; index: 126 };
  payload: { value: string; count: 126 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req127 = client.createRequest<{
  response: { id: number; name: string; index: 127 };
  payload: { value: string; count: 127 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req128 = client.createRequest<{
  response: { id: number; name: string; index: 128 };
  payload: { value: string; count: 128 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req129 = client.createRequest<{
  response: { id: number; name: string; index: 129 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req130 = client.createRequest<{ response: { id: number; name: string; index: 130 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req131 = client.createRequest<{
  response: { id: number; name: string; index: 131 };
  payload: { value: string; count: 131 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req132 = client.createRequest<{
  response: { id: number; name: string; index: 132 };
  payload: { value: string; count: 132 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req133 = client.createRequest<{
  response: { id: number; name: string; index: 133 };
  payload: { value: string; count: 133 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req134 = client.createRequest<{ response: { id: number; name: string; index: 134 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req135 = client.createRequest<{
  response: { id: number; name: string; index: 135 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req136 = client.createRequest<{
  response: { id: number; name: string; index: 136 };
  payload: { value: string; count: 136 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req137 = client.createRequest<{
  response: { id: number; name: string; index: 137 };
  payload: { value: string; count: 137 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req138 = client.createRequest<{
  response: { id: number; name: string; index: 138 };
  payload: { value: string; count: 138 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req139 = client.createRequest<{ response: { id: number; name: string; index: 139 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req140 = client.createRequest<{ response: { id: number; name: string; index: 140 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req141 = client.createRequest<{
  response: { id: number; name: string; index: 141 };
  payload: { value: string; count: 141 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req142 = client.createRequest<{
  response: { id: number; name: string; index: 142 };
  payload: { value: string; count: 142 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req143 = client.createRequest<{
  response: { id: number; name: string; index: 143 };
  payload: { value: string; count: 143 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req144 = client.createRequest<{
  response: { id: number; name: string; index: 144 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req145 = client.createRequest<{ response: { id: number; name: string; index: 145 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req146 = client.createRequest<{
  response: { id: number; name: string; index: 146 };
  payload: { value: string; count: 146 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req147 = client.createRequest<{
  response: { id: number; name: string; index: 147 };
  payload: { value: string; count: 147 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req148 = client.createRequest<{
  response: { id: number; name: string; index: 148 };
  payload: { value: string; count: 148 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req149 = client.createRequest<{ response: { id: number; name: string; index: 149 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req150 = client.createRequest<{
  response: { id: number; name: string; index: 150 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req151 = client.createRequest<{
  response: { id: number; name: string; index: 151 };
  payload: { value: string; count: 151 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req152 = client.createRequest<{
  response: { id: number; name: string; index: 152 };
  payload: { value: string; count: 152 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req153 = client.createRequest<{
  response: { id: number; name: string; index: 153 };
  payload: { value: string; count: 153 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req154 = client.createRequest<{ response: { id: number; name: string; index: 154 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req155 = client.createRequest<{ response: { id: number; name: string; index: 155 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req156 = client.createRequest<{
  response: { id: number; name: string; index: 156 };
  payload: { value: string; count: 156 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req157 = client.createRequest<{
  response: { id: number; name: string; index: 157 };
  payload: { value: string; count: 157 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req158 = client.createRequest<{
  response: { id: number; name: string; index: 158 };
  payload: { value: string; count: 158 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req159 = client.createRequest<{
  response: { id: number; name: string; index: 159 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req160 = client.createRequest<{ response: { id: number; name: string; index: 160 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req161 = client.createRequest<{
  response: { id: number; name: string; index: 161 };
  payload: { value: string; count: 161 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req162 = client.createRequest<{
  response: { id: number; name: string; index: 162 };
  payload: { value: string; count: 162 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req163 = client.createRequest<{
  response: { id: number; name: string; index: 163 };
  payload: { value: string; count: 163 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req164 = client.createRequest<{ response: { id: number; name: string; index: 164 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req165 = client.createRequest<{
  response: { id: number; name: string; index: 165 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req166 = client.createRequest<{
  response: { id: number; name: string; index: 166 };
  payload: { value: string; count: 166 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req167 = client.createRequest<{
  response: { id: number; name: string; index: 167 };
  payload: { value: string; count: 167 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req168 = client.createRequest<{
  response: { id: number; name: string; index: 168 };
  payload: { value: string; count: 168 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req169 = client.createRequest<{ response: { id: number; name: string; index: 169 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req170 = client.createRequest<{ response: { id: number; name: string; index: 170 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req171 = client.createRequest<{
  response: { id: number; name: string; index: 171 };
  payload: { value: string; count: 171 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req172 = client.createRequest<{
  response: { id: number; name: string; index: 172 };
  payload: { value: string; count: 172 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req173 = client.createRequest<{
  response: { id: number; name: string; index: 173 };
  payload: { value: string; count: 173 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req174 = client.createRequest<{
  response: { id: number; name: string; index: 174 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req175 = client.createRequest<{ response: { id: number; name: string; index: 175 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req176 = client.createRequest<{
  response: { id: number; name: string; index: 176 };
  payload: { value: string; count: 176 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req177 = client.createRequest<{
  response: { id: number; name: string; index: 177 };
  payload: { value: string; count: 177 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req178 = client.createRequest<{
  response: { id: number; name: string; index: 178 };
  payload: { value: string; count: 178 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req179 = client.createRequest<{ response: { id: number; name: string; index: 179 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req180 = client.createRequest<{
  response: { id: number; name: string; index: 180 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req181 = client.createRequest<{
  response: { id: number; name: string; index: 181 };
  payload: { value: string; count: 181 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req182 = client.createRequest<{
  response: { id: number; name: string; index: 182 };
  payload: { value: string; count: 182 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req183 = client.createRequest<{
  response: { id: number; name: string; index: 183 };
  payload: { value: string; count: 183 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req184 = client.createRequest<{ response: { id: number; name: string; index: 184 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req185 = client.createRequest<{ response: { id: number; name: string; index: 185 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req186 = client.createRequest<{
  response: { id: number; name: string; index: 186 };
  payload: { value: string; count: 186 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req187 = client.createRequest<{
  response: { id: number; name: string; index: 187 };
  payload: { value: string; count: 187 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req188 = client.createRequest<{
  response: { id: number; name: string; index: 188 };
  payload: { value: string; count: 188 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req189 = client.createRequest<{
  response: { id: number; name: string; index: 189 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req190 = client.createRequest<{ response: { id: number; name: string; index: 190 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req191 = client.createRequest<{
  response: { id: number; name: string; index: 191 };
  payload: { value: string; count: 191 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req192 = client.createRequest<{
  response: { id: number; name: string; index: 192 };
  payload: { value: string; count: 192 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req193 = client.createRequest<{
  response: { id: number; name: string; index: 193 };
  payload: { value: string; count: 193 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req194 = client.createRequest<{ response: { id: number; name: string; index: 194 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req195 = client.createRequest<{
  response: { id: number; name: string; index: 195 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req196 = client.createRequest<{
  response: { id: number; name: string; index: 196 };
  payload: { value: string; count: 196 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req197 = client.createRequest<{
  response: { id: number; name: string; index: 197 };
  payload: { value: string; count: 197 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req198 = client.createRequest<{
  response: { id: number; name: string; index: 198 };
  payload: { value: string; count: 198 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req199 = client.createRequest<{ response: { id: number; name: string; index: 199 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req200 = client.createRequest<{ response: { id: number; name: string; index: 200 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req201 = client.createRequest<{
  response: { id: number; name: string; index: 201 };
  payload: { value: string; count: 201 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req202 = client.createRequest<{
  response: { id: number; name: string; index: 202 };
  payload: { value: string; count: 202 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req203 = client.createRequest<{
  response: { id: number; name: string; index: 203 };
  payload: { value: string; count: 203 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req204 = client.createRequest<{
  response: { id: number; name: string; index: 204 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req205 = client.createRequest<{ response: { id: number; name: string; index: 205 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req206 = client.createRequest<{
  response: { id: number; name: string; index: 206 };
  payload: { value: string; count: 206 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req207 = client.createRequest<{
  response: { id: number; name: string; index: 207 };
  payload: { value: string; count: 207 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req208 = client.createRequest<{
  response: { id: number; name: string; index: 208 };
  payload: { value: string; count: 208 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req209 = client.createRequest<{ response: { id: number; name: string; index: 209 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req210 = client.createRequest<{
  response: { id: number; name: string; index: 210 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req211 = client.createRequest<{
  response: { id: number; name: string; index: 211 };
  payload: { value: string; count: 211 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req212 = client.createRequest<{
  response: { id: number; name: string; index: 212 };
  payload: { value: string; count: 212 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req213 = client.createRequest<{
  response: { id: number; name: string; index: 213 };
  payload: { value: string; count: 213 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req214 = client.createRequest<{ response: { id: number; name: string; index: 214 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req215 = client.createRequest<{ response: { id: number; name: string; index: 215 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req216 = client.createRequest<{
  response: { id: number; name: string; index: 216 };
  payload: { value: string; count: 216 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req217 = client.createRequest<{
  response: { id: number; name: string; index: 217 };
  payload: { value: string; count: 217 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req218 = client.createRequest<{
  response: { id: number; name: string; index: 218 };
  payload: { value: string; count: 218 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req219 = client.createRequest<{
  response: { id: number; name: string; index: 219 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req220 = client.createRequest<{ response: { id: number; name: string; index: 220 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req221 = client.createRequest<{
  response: { id: number; name: string; index: 221 };
  payload: { value: string; count: 221 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req222 = client.createRequest<{
  response: { id: number; name: string; index: 222 };
  payload: { value: string; count: 222 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req223 = client.createRequest<{
  response: { id: number; name: string; index: 223 };
  payload: { value: string; count: 223 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req224 = client.createRequest<{ response: { id: number; name: string; index: 224 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req225 = client.createRequest<{
  response: { id: number; name: string; index: 225 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req226 = client.createRequest<{
  response: { id: number; name: string; index: 226 };
  payload: { value: string; count: 226 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req227 = client.createRequest<{
  response: { id: number; name: string; index: 227 };
  payload: { value: string; count: 227 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req228 = client.createRequest<{
  response: { id: number; name: string; index: 228 };
  payload: { value: string; count: 228 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req229 = client.createRequest<{ response: { id: number; name: string; index: 229 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req230 = client.createRequest<{ response: { id: number; name: string; index: 230 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req231 = client.createRequest<{
  response: { id: number; name: string; index: 231 };
  payload: { value: string; count: 231 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req232 = client.createRequest<{
  response: { id: number; name: string; index: 232 };
  payload: { value: string; count: 232 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req233 = client.createRequest<{
  response: { id: number; name: string; index: 233 };
  payload: { value: string; count: 233 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req234 = client.createRequest<{
  response: { id: number; name: string; index: 234 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req235 = client.createRequest<{ response: { id: number; name: string; index: 235 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req236 = client.createRequest<{
  response: { id: number; name: string; index: 236 };
  payload: { value: string; count: 236 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req237 = client.createRequest<{
  response: { id: number; name: string; index: 237 };
  payload: { value: string; count: 237 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req238 = client.createRequest<{
  response: { id: number; name: string; index: 238 };
  payload: { value: string; count: 238 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req239 = client.createRequest<{ response: { id: number; name: string; index: 239 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req240 = client.createRequest<{
  response: { id: number; name: string; index: 240 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req241 = client.createRequest<{
  response: { id: number; name: string; index: 241 };
  payload: { value: string; count: 241 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req242 = client.createRequest<{
  response: { id: number; name: string; index: 242 };
  payload: { value: string; count: 242 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req243 = client.createRequest<{
  response: { id: number; name: string; index: 243 };
  payload: { value: string; count: 243 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req244 = client.createRequest<{ response: { id: number; name: string; index: 244 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req245 = client.createRequest<{ response: { id: number; name: string; index: 245 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req246 = client.createRequest<{
  response: { id: number; name: string; index: 246 };
  payload: { value: string; count: 246 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req247 = client.createRequest<{
  response: { id: number; name: string; index: 247 };
  payload: { value: string; count: 247 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req248 = client.createRequest<{
  response: { id: number; name: string; index: 248 };
  payload: { value: string; count: 248 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req249 = client.createRequest<{
  response: { id: number; name: string; index: 249 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req250 = client.createRequest<{ response: { id: number; name: string; index: 250 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req251 = client.createRequest<{
  response: { id: number; name: string; index: 251 };
  payload: { value: string; count: 251 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req252 = client.createRequest<{
  response: { id: number; name: string; index: 252 };
  payload: { value: string; count: 252 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req253 = client.createRequest<{
  response: { id: number; name: string; index: 253 };
  payload: { value: string; count: 253 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req254 = client.createRequest<{ response: { id: number; name: string; index: 254 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req255 = client.createRequest<{
  response: { id: number; name: string; index: 255 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req256 = client.createRequest<{
  response: { id: number; name: string; index: 256 };
  payload: { value: string; count: 256 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req257 = client.createRequest<{
  response: { id: number; name: string; index: 257 };
  payload: { value: string; count: 257 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req258 = client.createRequest<{
  response: { id: number; name: string; index: 258 };
  payload: { value: string; count: 258 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req259 = client.createRequest<{ response: { id: number; name: string; index: 259 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req260 = client.createRequest<{ response: { id: number; name: string; index: 260 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req261 = client.createRequest<{
  response: { id: number; name: string; index: 261 };
  payload: { value: string; count: 261 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req262 = client.createRequest<{
  response: { id: number; name: string; index: 262 };
  payload: { value: string; count: 262 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req263 = client.createRequest<{
  response: { id: number; name: string; index: 263 };
  payload: { value: string; count: 263 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req264 = client.createRequest<{
  response: { id: number; name: string; index: 264 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req265 = client.createRequest<{ response: { id: number; name: string; index: 265 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req266 = client.createRequest<{
  response: { id: number; name: string; index: 266 };
  payload: { value: string; count: 266 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req267 = client.createRequest<{
  response: { id: number; name: string; index: 267 };
  payload: { value: string; count: 267 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req268 = client.createRequest<{
  response: { id: number; name: string; index: 268 };
  payload: { value: string; count: 268 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req269 = client.createRequest<{ response: { id: number; name: string; index: 269 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req270 = client.createRequest<{
  response: { id: number; name: string; index: 270 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req271 = client.createRequest<{
  response: { id: number; name: string; index: 271 };
  payload: { value: string; count: 271 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req272 = client.createRequest<{
  response: { id: number; name: string; index: 272 };
  payload: { value: string; count: 272 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req273 = client.createRequest<{
  response: { id: number; name: string; index: 273 };
  payload: { value: string; count: 273 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req274 = client.createRequest<{ response: { id: number; name: string; index: 274 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req275 = client.createRequest<{ response: { id: number; name: string; index: 275 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req276 = client.createRequest<{
  response: { id: number; name: string; index: 276 };
  payload: { value: string; count: 276 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req277 = client.createRequest<{
  response: { id: number; name: string; index: 277 };
  payload: { value: string; count: 277 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req278 = client.createRequest<{
  response: { id: number; name: string; index: 278 };
  payload: { value: string; count: 278 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req279 = client.createRequest<{
  response: { id: number; name: string; index: 279 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req280 = client.createRequest<{ response: { id: number; name: string; index: 280 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req281 = client.createRequest<{
  response: { id: number; name: string; index: 281 };
  payload: { value: string; count: 281 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req282 = client.createRequest<{
  response: { id: number; name: string; index: 282 };
  payload: { value: string; count: 282 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req283 = client.createRequest<{
  response: { id: number; name: string; index: 283 };
  payload: { value: string; count: 283 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req284 = client.createRequest<{ response: { id: number; name: string; index: 284 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req285 = client.createRequest<{
  response: { id: number; name: string; index: 285 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req286 = client.createRequest<{
  response: { id: number; name: string; index: 286 };
  payload: { value: string; count: 286 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req287 = client.createRequest<{
  response: { id: number; name: string; index: 287 };
  payload: { value: string; count: 287 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req288 = client.createRequest<{
  response: { id: number; name: string; index: 288 };
  payload: { value: string; count: 288 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req289 = client.createRequest<{ response: { id: number; name: string; index: 289 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req290 = client.createRequest<{ response: { id: number; name: string; index: 290 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req291 = client.createRequest<{
  response: { id: number; name: string; index: 291 };
  payload: { value: string; count: 291 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req292 = client.createRequest<{
  response: { id: number; name: string; index: 292 };
  payload: { value: string; count: 292 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req293 = client.createRequest<{
  response: { id: number; name: string; index: 293 };
  payload: { value: string; count: 293 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req294 = client.createRequest<{
  response: { id: number; name: string; index: 294 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req295 = client.createRequest<{ response: { id: number; name: string; index: 295 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req296 = client.createRequest<{
  response: { id: number; name: string; index: 296 };
  payload: { value: string; count: 296 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req297 = client.createRequest<{
  response: { id: number; name: string; index: 297 };
  payload: { value: string; count: 297 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req298 = client.createRequest<{
  response: { id: number; name: string; index: 298 };
  payload: { value: string; count: 298 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req299 = client.createRequest<{ response: { id: number; name: string; index: 299 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req300 = client.createRequest<{
  response: { id: number; name: string; index: 300 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req301 = client.createRequest<{
  response: { id: number; name: string; index: 301 };
  payload: { value: string; count: 301 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req302 = client.createRequest<{
  response: { id: number; name: string; index: 302 };
  payload: { value: string; count: 302 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req303 = client.createRequest<{
  response: { id: number; name: string; index: 303 };
  payload: { value: string; count: 303 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req304 = client.createRequest<{ response: { id: number; name: string; index: 304 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req305 = client.createRequest<{ response: { id: number; name: string; index: 305 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req306 = client.createRequest<{
  response: { id: number; name: string; index: 306 };
  payload: { value: string; count: 306 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req307 = client.createRequest<{
  response: { id: number; name: string; index: 307 };
  payload: { value: string; count: 307 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req308 = client.createRequest<{
  response: { id: number; name: string; index: 308 };
  payload: { value: string; count: 308 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req309 = client.createRequest<{
  response: { id: number; name: string; index: 309 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req310 = client.createRequest<{ response: { id: number; name: string; index: 310 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req311 = client.createRequest<{
  response: { id: number; name: string; index: 311 };
  payload: { value: string; count: 311 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req312 = client.createRequest<{
  response: { id: number; name: string; index: 312 };
  payload: { value: string; count: 312 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req313 = client.createRequest<{
  response: { id: number; name: string; index: 313 };
  payload: { value: string; count: 313 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req314 = client.createRequest<{ response: { id: number; name: string; index: 314 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req315 = client.createRequest<{
  response: { id: number; name: string; index: 315 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req316 = client.createRequest<{
  response: { id: number; name: string; index: 316 };
  payload: { value: string; count: 316 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req317 = client.createRequest<{
  response: { id: number; name: string; index: 317 };
  payload: { value: string; count: 317 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req318 = client.createRequest<{
  response: { id: number; name: string; index: 318 };
  payload: { value: string; count: 318 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req319 = client.createRequest<{ response: { id: number; name: string; index: 319 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req320 = client.createRequest<{ response: { id: number; name: string; index: 320 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req321 = client.createRequest<{
  response: { id: number; name: string; index: 321 };
  payload: { value: string; count: 321 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req322 = client.createRequest<{
  response: { id: number; name: string; index: 322 };
  payload: { value: string; count: 322 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req323 = client.createRequest<{
  response: { id: number; name: string; index: 323 };
  payload: { value: string; count: 323 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req324 = client.createRequest<{
  response: { id: number; name: string; index: 324 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req325 = client.createRequest<{ response: { id: number; name: string; index: 325 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req326 = client.createRequest<{
  response: { id: number; name: string; index: 326 };
  payload: { value: string; count: 326 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req327 = client.createRequest<{
  response: { id: number; name: string; index: 327 };
  payload: { value: string; count: 327 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req328 = client.createRequest<{
  response: { id: number; name: string; index: 328 };
  payload: { value: string; count: 328 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req329 = client.createRequest<{ response: { id: number; name: string; index: 329 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req330 = client.createRequest<{
  response: { id: number; name: string; index: 330 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req331 = client.createRequest<{
  response: { id: number; name: string; index: 331 };
  payload: { value: string; count: 331 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req332 = client.createRequest<{
  response: { id: number; name: string; index: 332 };
  payload: { value: string; count: 332 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req333 = client.createRequest<{
  response: { id: number; name: string; index: 333 };
  payload: { value: string; count: 333 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req334 = client.createRequest<{ response: { id: number; name: string; index: 334 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req335 = client.createRequest<{ response: { id: number; name: string; index: 335 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req336 = client.createRequest<{
  response: { id: number; name: string; index: 336 };
  payload: { value: string; count: 336 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req337 = client.createRequest<{
  response: { id: number; name: string; index: 337 };
  payload: { value: string; count: 337 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req338 = client.createRequest<{
  response: { id: number; name: string; index: 338 };
  payload: { value: string; count: 338 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req339 = client.createRequest<{
  response: { id: number; name: string; index: 339 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req340 = client.createRequest<{ response: { id: number; name: string; index: 340 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req341 = client.createRequest<{
  response: { id: number; name: string; index: 341 };
  payload: { value: string; count: 341 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req342 = client.createRequest<{
  response: { id: number; name: string; index: 342 };
  payload: { value: string; count: 342 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req343 = client.createRequest<{
  response: { id: number; name: string; index: 343 };
  payload: { value: string; count: 343 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req344 = client.createRequest<{ response: { id: number; name: string; index: 344 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req345 = client.createRequest<{
  response: { id: number; name: string; index: 345 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req346 = client.createRequest<{
  response: { id: number; name: string; index: 346 };
  payload: { value: string; count: 346 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req347 = client.createRequest<{
  response: { id: number; name: string; index: 347 };
  payload: { value: string; count: 347 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req348 = client.createRequest<{
  response: { id: number; name: string; index: 348 };
  payload: { value: string; count: 348 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req349 = client.createRequest<{ response: { id: number; name: string; index: 349 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req350 = client.createRequest<{ response: { id: number; name: string; index: 350 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req351 = client.createRequest<{
  response: { id: number; name: string; index: 351 };
  payload: { value: string; count: 351 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req352 = client.createRequest<{
  response: { id: number; name: string; index: 352 };
  payload: { value: string; count: 352 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req353 = client.createRequest<{
  response: { id: number; name: string; index: 353 };
  payload: { value: string; count: 353 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req354 = client.createRequest<{
  response: { id: number; name: string; index: 354 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req355 = client.createRequest<{ response: { id: number; name: string; index: 355 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req356 = client.createRequest<{
  response: { id: number; name: string; index: 356 };
  payload: { value: string; count: 356 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req357 = client.createRequest<{
  response: { id: number; name: string; index: 357 };
  payload: { value: string; count: 357 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req358 = client.createRequest<{
  response: { id: number; name: string; index: 358 };
  payload: { value: string; count: 358 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req359 = client.createRequest<{ response: { id: number; name: string; index: 359 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req360 = client.createRequest<{
  response: { id: number; name: string; index: 360 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req361 = client.createRequest<{
  response: { id: number; name: string; index: 361 };
  payload: { value: string; count: 361 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req362 = client.createRequest<{
  response: { id: number; name: string; index: 362 };
  payload: { value: string; count: 362 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req363 = client.createRequest<{
  response: { id: number; name: string; index: 363 };
  payload: { value: string; count: 363 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req364 = client.createRequest<{ response: { id: number; name: string; index: 364 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req365 = client.createRequest<{ response: { id: number; name: string; index: 365 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req366 = client.createRequest<{
  response: { id: number; name: string; index: 366 };
  payload: { value: string; count: 366 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req367 = client.createRequest<{
  response: { id: number; name: string; index: 367 };
  payload: { value: string; count: 367 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req368 = client.createRequest<{
  response: { id: number; name: string; index: 368 };
  payload: { value: string; count: 368 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req369 = client.createRequest<{
  response: { id: number; name: string; index: 369 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req370 = client.createRequest<{ response: { id: number; name: string; index: 370 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req371 = client.createRequest<{
  response: { id: number; name: string; index: 371 };
  payload: { value: string; count: 371 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req372 = client.createRequest<{
  response: { id: number; name: string; index: 372 };
  payload: { value: string; count: 372 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req373 = client.createRequest<{
  response: { id: number; name: string; index: 373 };
  payload: { value: string; count: 373 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req374 = client.createRequest<{ response: { id: number; name: string; index: 374 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req375 = client.createRequest<{
  response: { id: number; name: string; index: 375 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req376 = client.createRequest<{
  response: { id: number; name: string; index: 376 };
  payload: { value: string; count: 376 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req377 = client.createRequest<{
  response: { id: number; name: string; index: 377 };
  payload: { value: string; count: 377 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req378 = client.createRequest<{
  response: { id: number; name: string; index: 378 };
  payload: { value: string; count: 378 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req379 = client.createRequest<{ response: { id: number; name: string; index: 379 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req380 = client.createRequest<{ response: { id: number; name: string; index: 380 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req381 = client.createRequest<{
  response: { id: number; name: string; index: 381 };
  payload: { value: string; count: 381 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req382 = client.createRequest<{
  response: { id: number; name: string; index: 382 };
  payload: { value: string; count: 382 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req383 = client.createRequest<{
  response: { id: number; name: string; index: 383 };
  payload: { value: string; count: 383 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req384 = client.createRequest<{
  response: { id: number; name: string; index: 384 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req385 = client.createRequest<{ response: { id: number; name: string; index: 385 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req386 = client.createRequest<{
  response: { id: number; name: string; index: 386 };
  payload: { value: string; count: 386 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req387 = client.createRequest<{
  response: { id: number; name: string; index: 387 };
  payload: { value: string; count: 387 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req388 = client.createRequest<{
  response: { id: number; name: string; index: 388 };
  payload: { value: string; count: 388 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req389 = client.createRequest<{ response: { id: number; name: string; index: 389 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req390 = client.createRequest<{
  response: { id: number; name: string; index: 390 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req391 = client.createRequest<{
  response: { id: number; name: string; index: 391 };
  payload: { value: string; count: 391 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req392 = client.createRequest<{
  response: { id: number; name: string; index: 392 };
  payload: { value: string; count: 392 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req393 = client.createRequest<{
  response: { id: number; name: string; index: 393 };
  payload: { value: string; count: 393 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req394 = client.createRequest<{ response: { id: number; name: string; index: 394 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req395 = client.createRequest<{ response: { id: number; name: string; index: 395 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req396 = client.createRequest<{
  response: { id: number; name: string; index: 396 };
  payload: { value: string; count: 396 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req397 = client.createRequest<{
  response: { id: number; name: string; index: 397 };
  payload: { value: string; count: 397 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req398 = client.createRequest<{
  response: { id: number; name: string; index: 398 };
  payload: { value: string; count: 398 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req399 = client.createRequest<{
  response: { id: number; name: string; index: 399 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req400 = client.createRequest<{ response: { id: number; name: string; index: 400 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req401 = client.createRequest<{
  response: { id: number; name: string; index: 401 };
  payload: { value: string; count: 401 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req402 = client.createRequest<{
  response: { id: number; name: string; index: 402 };
  payload: { value: string; count: 402 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req403 = client.createRequest<{
  response: { id: number; name: string; index: 403 };
  payload: { value: string; count: 403 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req404 = client.createRequest<{ response: { id: number; name: string; index: 404 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req405 = client.createRequest<{
  response: { id: number; name: string; index: 405 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req406 = client.createRequest<{
  response: { id: number; name: string; index: 406 };
  payload: { value: string; count: 406 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req407 = client.createRequest<{
  response: { id: number; name: string; index: 407 };
  payload: { value: string; count: 407 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req408 = client.createRequest<{
  response: { id: number; name: string; index: 408 };
  payload: { value: string; count: 408 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req409 = client.createRequest<{ response: { id: number; name: string; index: 409 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req410 = client.createRequest<{ response: { id: number; name: string; index: 410 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req411 = client.createRequest<{
  response: { id: number; name: string; index: 411 };
  payload: { value: string; count: 411 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req412 = client.createRequest<{
  response: { id: number; name: string; index: 412 };
  payload: { value: string; count: 412 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req413 = client.createRequest<{
  response: { id: number; name: string; index: 413 };
  payload: { value: string; count: 413 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req414 = client.createRequest<{
  response: { id: number; name: string; index: 414 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req415 = client.createRequest<{ response: { id: number; name: string; index: 415 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req416 = client.createRequest<{
  response: { id: number; name: string; index: 416 };
  payload: { value: string; count: 416 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req417 = client.createRequest<{
  response: { id: number; name: string; index: 417 };
  payload: { value: string; count: 417 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req418 = client.createRequest<{
  response: { id: number; name: string; index: 418 };
  payload: { value: string; count: 418 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req419 = client.createRequest<{ response: { id: number; name: string; index: 419 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req420 = client.createRequest<{
  response: { id: number; name: string; index: 420 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req421 = client.createRequest<{
  response: { id: number; name: string; index: 421 };
  payload: { value: string; count: 421 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req422 = client.createRequest<{
  response: { id: number; name: string; index: 422 };
  payload: { value: string; count: 422 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req423 = client.createRequest<{
  response: { id: number; name: string; index: 423 };
  payload: { value: string; count: 423 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req424 = client.createRequest<{ response: { id: number; name: string; index: 424 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req425 = client.createRequest<{ response: { id: number; name: string; index: 425 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req426 = client.createRequest<{
  response: { id: number; name: string; index: 426 };
  payload: { value: string; count: 426 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req427 = client.createRequest<{
  response: { id: number; name: string; index: 427 };
  payload: { value: string; count: 427 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req428 = client.createRequest<{
  response: { id: number; name: string; index: 428 };
  payload: { value: string; count: 428 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req429 = client.createRequest<{
  response: { id: number; name: string; index: 429 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req430 = client.createRequest<{ response: { id: number; name: string; index: 430 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req431 = client.createRequest<{
  response: { id: number; name: string; index: 431 };
  payload: { value: string; count: 431 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req432 = client.createRequest<{
  response: { id: number; name: string; index: 432 };
  payload: { value: string; count: 432 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req433 = client.createRequest<{
  response: { id: number; name: string; index: 433 };
  payload: { value: string; count: 433 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req434 = client.createRequest<{ response: { id: number; name: string; index: 434 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req435 = client.createRequest<{
  response: { id: number; name: string; index: 435 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req436 = client.createRequest<{
  response: { id: number; name: string; index: 436 };
  payload: { value: string; count: 436 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req437 = client.createRequest<{
  response: { id: number; name: string; index: 437 };
  payload: { value: string; count: 437 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req438 = client.createRequest<{
  response: { id: number; name: string; index: 438 };
  payload: { value: string; count: 438 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req439 = client.createRequest<{ response: { id: number; name: string; index: 439 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req440 = client.createRequest<{ response: { id: number; name: string; index: 440 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req441 = client.createRequest<{
  response: { id: number; name: string; index: 441 };
  payload: { value: string; count: 441 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req442 = client.createRequest<{
  response: { id: number; name: string; index: 442 };
  payload: { value: string; count: 442 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req443 = client.createRequest<{
  response: { id: number; name: string; index: 443 };
  payload: { value: string; count: 443 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req444 = client.createRequest<{
  response: { id: number; name: string; index: 444 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req445 = client.createRequest<{ response: { id: number; name: string; index: 445 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req446 = client.createRequest<{
  response: { id: number; name: string; index: 446 };
  payload: { value: string; count: 446 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req447 = client.createRequest<{
  response: { id: number; name: string; index: 447 };
  payload: { value: string; count: 447 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req448 = client.createRequest<{
  response: { id: number; name: string; index: 448 };
  payload: { value: string; count: 448 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req449 = client.createRequest<{ response: { id: number; name: string; index: 449 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req450 = client.createRequest<{
  response: { id: number; name: string; index: 450 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req451 = client.createRequest<{
  response: { id: number; name: string; index: 451 };
  payload: { value: string; count: 451 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req452 = client.createRequest<{
  response: { id: number; name: string; index: 452 };
  payload: { value: string; count: 452 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req453 = client.createRequest<{
  response: { id: number; name: string; index: 453 };
  payload: { value: string; count: 453 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req454 = client.createRequest<{ response: { id: number; name: string; index: 454 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req455 = client.createRequest<{ response: { id: number; name: string; index: 455 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req456 = client.createRequest<{
  response: { id: number; name: string; index: 456 };
  payload: { value: string; count: 456 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req457 = client.createRequest<{
  response: { id: number; name: string; index: 457 };
  payload: { value: string; count: 457 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req458 = client.createRequest<{
  response: { id: number; name: string; index: 458 };
  payload: { value: string; count: 458 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req459 = client.createRequest<{
  response: { id: number; name: string; index: 459 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req460 = client.createRequest<{ response: { id: number; name: string; index: 460 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req461 = client.createRequest<{
  response: { id: number; name: string; index: 461 };
  payload: { value: string; count: 461 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req462 = client.createRequest<{
  response: { id: number; name: string; index: 462 };
  payload: { value: string; count: 462 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req463 = client.createRequest<{
  response: { id: number; name: string; index: 463 };
  payload: { value: string; count: 463 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req464 = client.createRequest<{ response: { id: number; name: string; index: 464 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req465 = client.createRequest<{
  response: { id: number; name: string; index: 465 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req466 = client.createRequest<{
  response: { id: number; name: string; index: 466 };
  payload: { value: string; count: 466 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req467 = client.createRequest<{
  response: { id: number; name: string; index: 467 };
  payload: { value: string; count: 467 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req468 = client.createRequest<{
  response: { id: number; name: string; index: 468 };
  payload: { value: string; count: 468 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req469 = client.createRequest<{ response: { id: number; name: string; index: 469 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req470 = client.createRequest<{ response: { id: number; name: string; index: 470 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req471 = client.createRequest<{
  response: { id: number; name: string; index: 471 };
  payload: { value: string; count: 471 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req472 = client.createRequest<{
  response: { id: number; name: string; index: 472 };
  payload: { value: string; count: 472 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req473 = client.createRequest<{
  response: { id: number; name: string; index: 473 };
  payload: { value: string; count: 473 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req474 = client.createRequest<{
  response: { id: number; name: string; index: 474 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products" as const, method: "DELETE" as const });
const req475 = client.createRequest<{ response: { id: number; name: string; index: 475 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req476 = client.createRequest<{
  response: { id: number; name: string; index: 476 };
  payload: { value: string; count: 476 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req477 = client.createRequest<{
  response: { id: number; name: string; index: 477 };
  payload: { value: string; count: 477 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req478 = client.createRequest<{
  response: { id: number; name: string; index: 478 };
  payload: { value: string; count: 478 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req479 = client.createRequest<{ response: { id: number; name: string; index: 479 } }>()({
  endpoint: "/settings" as const,
  method: "DELETE" as const,
});
const req480 = client.createRequest<{
  response: { id: number; name: string; index: 480 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users" as const, method: "GET" as const });
const req481 = client.createRequest<{
  response: { id: number; name: string; index: 481 };
  payload: { value: string; count: 481 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req482 = client.createRequest<{
  response: { id: number; name: string; index: 482 };
  payload: { value: string; count: 482 };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req483 = client.createRequest<{
  response: { id: number; name: string; index: 483 };
  payload: { value: string; count: 483 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req484 = client.createRequest<{ response: { id: number; name: string; index: 484 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req485 = client.createRequest<{ response: { id: number; name: string; index: 485 } }>()({
  endpoint: "/products/:productId" as const,
  method: "GET" as const,
});
const req486 = client.createRequest<{
  response: { id: number; name: string; index: 486 };
  payload: { value: string; count: 486 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req487 = client.createRequest<{
  response: { id: number; name: string; index: 487 };
  payload: { value: string; count: 487 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req488 = client.createRequest<{
  response: { id: number; name: string; index: 488 };
  payload: { value: string; count: 488 };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });
const req489 = client.createRequest<{
  response: { id: number; name: string; index: 489 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/settings" as const, method: "DELETE" as const });
const req490 = client.createRequest<{ response: { id: number; name: string; index: 490 } }>()({
  endpoint: "/users" as const,
  method: "GET" as const,
});
const req491 = client.createRequest<{
  response: { id: number; name: string; index: 491 };
  payload: { value: string; count: 491 };
}>()({ endpoint: "/users/:userId" as const, method: "POST" as const });
const req492 = client.createRequest<{
  response: { id: number; name: string; index: 492 };
  payload: { value: string; count: 492 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/users/:userId/posts" as const, method: "PUT" as const });
const req493 = client.createRequest<{
  response: { id: number; name: string; index: 493 };
  payload: { value: string; count: 493 };
}>()({ endpoint: "/users/:userId/posts/:postId" as const, method: "PATCH" as const });
const req494 = client.createRequest<{ response: { id: number; name: string; index: 494 } }>()({
  endpoint: "/products" as const,
  method: "DELETE" as const,
});
const req495 = client.createRequest<{
  response: { id: number; name: string; index: 495 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/products/:productId" as const, method: "GET" as const });
const req496 = client.createRequest<{
  response: { id: number; name: string; index: 496 };
  payload: { value: string; count: 496 };
}>()({ endpoint: "/orders/:orderId/items/:itemId" as const, method: "POST" as const });
const req497 = client.createRequest<{
  response: { id: number; name: string; index: 497 };
  payload: { value: string; count: 497 };
}>()({ endpoint: "/auth/login" as const, method: "PUT" as const });
const req498 = client.createRequest<{
  response: { id: number; name: string; index: 498 };
  payload: { value: string; count: 498 };
  queryParams: { page: number; limit: number };
}>()({ endpoint: "/auth/register" as const, method: "PATCH" as const });

const a = "123";

export { a };
