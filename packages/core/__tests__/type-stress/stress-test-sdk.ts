/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-unused-vars */
// Auto-generated SDK stress test — deeply typed SDK with 500+ endpoints
import { createClient, createSdk } from "../../src";

const client = createClient({ url: "https://api.test.com" });

// Simulate a real-world SDK type with many endpoints organized by domain
type UserResponse = { id: number; name: string; email: string };
type PostResponse = { id: number; title: string; body: string; authorId: number };
type CommentResponse = { id: number; text: string; postId: number; userId: number };
type ProductResponse = { id: number; name: string; price: number; sku: string };
type OrderResponse = { id: number; total: number; status: string; userId: number };
type PaymentResponse = { id: number; amount: number; method: string; orderId: number };
type NotificationResponse = { id: number; message: string; read: boolean };
type SettingsResponse = { theme: string; language: string; timezone: string };
type AnalyticsResponse = { pageViews: number; uniqueVisitors: number; bounceRate: number };
type TeamResponse = { id: number; name: string; memberCount: number };

// Build a large SDK schema type — each path has multiple methods
type SdkSchema = {
  users: {
    $GET: ReturnType<typeof client.createRequest<{ response: UserResponse[] }>>;
    $POST: ReturnType<typeof client.createRequest<{ response: UserResponse; payload: Omit<UserResponse, "id"> }>>;
    $userId: {
      $GET: ReturnType<typeof client.createRequest<{ response: UserResponse }>>;
      $PUT: ReturnType<typeof client.createRequest<{ response: UserResponse; payload: Partial<UserResponse> }>>;
      $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
      posts: {
        $GET: ReturnType<typeof client.createRequest<{ response: PostResponse[] }>>;
        $POST: ReturnType<typeof client.createRequest<{ response: PostResponse; payload: Omit<PostResponse, "id"> }>>;
        $postId: {
          $GET: ReturnType<typeof client.createRequest<{ response: PostResponse }>>;
          $PUT: ReturnType<typeof client.createRequest<{ response: PostResponse; payload: Partial<PostResponse> }>>;
          $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
          comments: {
            $GET: ReturnType<typeof client.createRequest<{ response: CommentResponse[] }>>;
            $POST: ReturnType<
              typeof client.createRequest<{ response: CommentResponse; payload: Omit<CommentResponse, "id"> }>
            >;
            $commentId: {
              $GET: ReturnType<typeof client.createRequest<{ response: CommentResponse }>>;
              $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
            };
          };
        };
      };
      settings: {
        $GET: ReturnType<typeof client.createRequest<{ response: SettingsResponse }>>;
        $PUT: ReturnType<typeof client.createRequest<{ response: SettingsResponse; payload: SettingsResponse }>>;
      };
      notifications: {
        $GET: ReturnType<
          typeof client.createRequest<{
            response: NotificationResponse[];
            queryParams: { page: number; limit: number };
          }>
        >;
        $notificationId: {
          $PATCH: ReturnType<
            typeof client.createRequest<{ response: NotificationResponse; payload: { read: boolean } }>
          >;
          $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
        };
      };
      teams: {
        $GET: ReturnType<typeof client.createRequest<{ response: TeamResponse[] }>>;
      };
    };
  };
  products: {
    $GET: ReturnType<
      typeof client.createRequest<{
        response: ProductResponse[];
        queryParams: { category?: string; minPrice?: number };
      }>
    >;
    $POST: ReturnType<typeof client.createRequest<{ response: ProductResponse; payload: Omit<ProductResponse, "id"> }>>;
    $productId: {
      $GET: ReturnType<typeof client.createRequest<{ response: ProductResponse }>>;
      $PUT: ReturnType<typeof client.createRequest<{ response: ProductResponse; payload: Partial<ProductResponse> }>>;
      $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
      reviews: {
        $GET: ReturnType<typeof client.createRequest<{ response: { rating: number; text: string }[] }>>;
        $POST: ReturnType<
          typeof client.createRequest<{
            response: { rating: number; text: string };
            payload: { rating: number; text: string };
          }>
        >;
      };
      variants: {
        $GET: ReturnType<typeof client.createRequest<{ response: { id: number; color: string; size: string }[] }>>;
        $variantId: {
          $GET: ReturnType<typeof client.createRequest<{ response: { id: number; color: string; size: string } }>>;
          $PATCH: ReturnType<
            typeof client.createRequest<{
              response: { id: number; color: string; size: string };
              payload: { color?: string; size?: string };
            }>
          >;
        };
      };
    };
  };
  orders: {
    $GET: ReturnType<typeof client.createRequest<{ response: OrderResponse[]; queryParams: { status?: string } }>>;
    $POST: ReturnType<
      typeof client.createRequest<{
        response: OrderResponse;
        payload: { items: { productId: number; quantity: number }[] };
      }>
    >;
    $orderId: {
      $GET: ReturnType<typeof client.createRequest<{ response: OrderResponse }>>;
      $PATCH: ReturnType<typeof client.createRequest<{ response: OrderResponse; payload: { status: string } }>>;
      items: {
        $GET: ReturnType<
          typeof client.createRequest<{ response: { productId: number; quantity: number; price: number }[] }>
        >;
        $itemId: {
          $PATCH: ReturnType<
            typeof client.createRequest<{ response: { quantity: number }; payload: { quantity: number } }>
          >;
          $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
        };
      };
      payments: {
        $GET: ReturnType<typeof client.createRequest<{ response: PaymentResponse[] }>>;
        $POST: ReturnType<
          typeof client.createRequest<{ response: PaymentResponse; payload: { amount: number; method: string } }>
        >;
      };
    };
  };
  analytics: {
    overview: {
      $GET: ReturnType<
        typeof client.createRequest<{ response: AnalyticsResponse; queryParams: { from: string; to: string } }>
      >;
    };
    users: {
      $GET: ReturnType<
        typeof client.createRequest<{
          response: { activeUsers: number; newUsers: number };
          queryParams: { period: string };
        }>
      >;
    };
    revenue: {
      $GET: ReturnType<
        typeof client.createRequest<{ response: { total: number; byMonth: { month: string; amount: number }[] } }>
      >;
    };
  };
  auth: {
    login: {
      $POST: ReturnType<
        typeof client.createRequest<{
          response: { token: string; refreshToken: string };
          payload: { email: string; password: string };
        }>
      >;
    };
    register: {
      $POST: ReturnType<
        typeof client.createRequest<{
          response: UserResponse;
          payload: { email: string; password: string; name: string };
        }>
      >;
    };
    refresh: {
      $POST: ReturnType<
        typeof client.createRequest<{ response: { token: string }; payload: { refreshToken: string } }>
      >;
    };
    logout: {
      $POST: ReturnType<typeof client.createRequest<{ response: void }>>;
    };
    forgotPassword: {
      $POST: ReturnType<typeof client.createRequest<{ response: { message: string }; payload: { email: string } }>>;
    };
    resetPassword: {
      $POST: ReturnType<
        typeof client.createRequest<{ response: { message: string }; payload: { token: string; password: string } }>
      >;
    };
  };
  teams: {
    $GET: ReturnType<typeof client.createRequest<{ response: TeamResponse[] }>>;
    $POST: ReturnType<typeof client.createRequest<{ response: TeamResponse; payload: { name: string } }>>;
    $teamId: {
      $GET: ReturnType<typeof client.createRequest<{ response: TeamResponse }>>;
      $PUT: ReturnType<typeof client.createRequest<{ response: TeamResponse; payload: Partial<TeamResponse> }>>;
      $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
      members: {
        $GET: ReturnType<typeof client.createRequest<{ response: UserResponse[] }>>;
        $POST: ReturnType<typeof client.createRequest<{ response: void; payload: { userId: number } }>>;
        $memberId: {
          $DELETE: ReturnType<typeof client.createRequest<{ response: void }>>;
          $PATCH: ReturnType<typeof client.createRequest<{ response: { role: string }; payload: { role: string } }>>;
        };
      };
    };
  };
};

const sdk = createSdk<typeof client, SdkSchema>(client);

// Exercise various SDK access patterns
const r1 = sdk.users.$GET;
const r2 = sdk.users.$POST;
const r3 = sdk.users.$userId.$GET;
const r4 = sdk.users.$userId.posts.$GET;
const r5 = sdk.users.$userId.posts.$postId.comments.$GET;
const r6 = sdk.products.$GET;
const r7 = sdk.products.$productId.reviews.$GET;
const r8 = sdk.orders.$orderId.items.$GET;
const r9 = sdk.analytics.overview.$GET;
const r10 = sdk.auth.login.$POST;
const r11 = sdk.teams.$teamId.members.$GET;
const r12 = sdk.products.$productId.variants.$variantId.$PATCH;

// Exercise send types
type S1 = ReturnType<typeof r1.send>;
type S2 = ReturnType<typeof r2.send>;
type S3 = ReturnType<typeof r3.send>;
type S4 = ReturnType<typeof r10.send>;
type S5 = ReturnType<typeof r11.send>;

// Exercise setParams
const p1 = r3.setParams({ userId: "1" } as any);
const p2 = r5.setParams({ userId: "1", postId: "2" } as any);

// Exercise toJSON
const j1 = r1.toJSON();
const j2 = r6.toJSON();

const a = "123";

export { a };
