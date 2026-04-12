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
type SdkRequest<T extends Record<string, any> = {}> = ReturnType<ReturnType<typeof client.createRequest<T>>>;

type SdkSchema = {
  users: {
    $GET: SdkRequest<{ response: UserResponse[] }>;
    $POST: SdkRequest<{ response: UserResponse; payload: Omit<UserResponse, "id"> }>;
    $userId: {
      $GET: SdkRequest<{ response: UserResponse }>;
      $PUT: SdkRequest<{ response: UserResponse; payload: Partial<UserResponse> }>;
      $DELETE: SdkRequest<{ response: void }>;
      posts: {
        $GET: SdkRequest<{ response: PostResponse[] }>;
        $POST: SdkRequest<{ response: PostResponse; payload: Omit<PostResponse, "id"> }>;
        $postId: {
          $GET: SdkRequest<{ response: PostResponse }>;
          $PUT: SdkRequest<{ response: PostResponse; payload: Partial<PostResponse> }>;
          $DELETE: SdkRequest<{ response: void }>;
          comments: {
            $GET: SdkRequest<{ response: CommentResponse[] }>;
            $POST: SdkRequest<{ response: CommentResponse; payload: Omit<CommentResponse, "id"> }>;
            $commentId: {
              $GET: SdkRequest<{ response: CommentResponse }>;
              $DELETE: SdkRequest<{ response: void }>;
            };
          };
        };
      };
      settings: {
        $GET: SdkRequest<{ response: SettingsResponse }>;
        $PUT: SdkRequest<{ response: SettingsResponse; payload: SettingsResponse }>;
      };
      notifications: {
        $GET: SdkRequest<{
          response: NotificationResponse[];
          queryParams: { page: number; limit: number };
        }>;
        $notificationId: {
          $PATCH: SdkRequest<{ response: NotificationResponse; payload: { read: boolean } }>;
          $DELETE: SdkRequest<{ response: void }>;
        };
      };
      teams: {
        $GET: SdkRequest<{ response: TeamResponse[] }>;
      };
    };
  };
  products: {
    $GET: SdkRequest<{
      response: ProductResponse[];
      queryParams: { category?: string; minPrice?: number };
    }>;
    $POST: SdkRequest<{ response: ProductResponse; payload: Omit<ProductResponse, "id"> }>;
    $productId: {
      $GET: SdkRequest<{ response: ProductResponse }>;
      $PUT: SdkRequest<{ response: ProductResponse; payload: Partial<ProductResponse> }>;
      $DELETE: SdkRequest<{ response: void }>;
      reviews: {
        $GET: SdkRequest<{ response: { rating: number; text: string }[] }>;
        $POST: SdkRequest<{
          response: { rating: number; text: string };
          payload: { rating: number; text: string };
        }>;
      };
      variants: {
        $GET: SdkRequest<{ response: { id: number; color: string; size: string }[] }>;
        $variantId: {
          $GET: SdkRequest<{ response: { id: number; color: string; size: string } }>;
          $PATCH: SdkRequest<{
            response: { id: number; color: string; size: string };
            payload: { color?: string; size?: string };
          }>;
        };
      };
    };
  };
  orders: {
    $GET: SdkRequest<{ response: OrderResponse[]; queryParams: { status?: string } }>;
    $POST: SdkRequest<{
      response: OrderResponse;
      payload: { items: { productId: number; quantity: number }[] };
    }>;
    $orderId: {
      $GET: SdkRequest<{ response: OrderResponse }>;
      $PATCH: SdkRequest<{ response: OrderResponse; payload: { status: string } }>;
      items: {
        $GET: SdkRequest<{ response: { productId: number; quantity: number; price: number }[] }>;
        $itemId: {
          $PATCH: SdkRequest<{ response: { quantity: number }; payload: { quantity: number } }>;
          $DELETE: SdkRequest<{ response: void }>;
        };
      };
      payments: {
        $GET: SdkRequest<{ response: PaymentResponse[] }>;
        $POST: SdkRequest<{ response: PaymentResponse; payload: { amount: number; method: string } }>;
      };
    };
  };
  analytics: {
    overview: {
      $GET: SdkRequest<{ response: AnalyticsResponse; queryParams: { from: string; to: string } }>;
    };
    users: {
      $GET: SdkRequest<{
        response: { activeUsers: number; newUsers: number };
        queryParams: { period: string };
      }>;
    };
    revenue: {
      $GET: SdkRequest<{ response: { total: number; byMonth: { month: string; amount: number }[] } }>;
    };
  };
  auth: {
    login: {
      $POST: SdkRequest<{
        response: { token: string; refreshToken: string };
        payload: { email: string; password: string };
      }>;
    };
    register: {
      $POST: SdkRequest<{
        response: UserResponse;
        payload: { email: string; password: string; name: string };
      }>;
    };
    refresh: {
      $POST: SdkRequest<{ response: { token: string }; payload: { refreshToken: string } }>;
    };
    logout: {
      $POST: SdkRequest<{ response: void }>;
    };
    forgotPassword: {
      $POST: SdkRequest<{ response: { message: string }; payload: { email: string } }>;
    };
    resetPassword: {
      $POST: SdkRequest<{ response: { message: string }; payload: { token: string; password: string } }>;
    };
  };
  teams: {
    $GET: SdkRequest<{ response: TeamResponse[] }>;
    $POST: SdkRequest<{ response: TeamResponse; payload: { name: string } }>;
    $teamId: {
      $GET: SdkRequest<{ response: TeamResponse }>;
      $PUT: SdkRequest<{ response: TeamResponse; payload: Partial<TeamResponse> }>;
      $DELETE: SdkRequest<{ response: void }>;
      members: {
        $GET: SdkRequest<{ response: UserResponse[] }>;
        $POST: SdkRequest<{ response: void; payload: { userId: number } }>;
        $memberId: {
          $DELETE: SdkRequest<{ response: void }>;
          $PATCH: SdkRequest<{ response: { role: string }; payload: { role: string } }>;
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
