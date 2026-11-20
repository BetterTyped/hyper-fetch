import { createSdk as coreCreateSdk } from "@hyper-fetch/core";
import type { ClientInstance, RequestModel } from "@hyper-fetch/core";

declare namespace Components {
  namespace RequestBodies {
    export type Pet = Schemas.Pet;
    export type UserArray = Schemas.User[];
  }
  namespace Schemas {
    export interface ApiResponse {
      code?: number; // int32
      type?: string;
      message?: string;
    }
    export interface Category {
      /**
       * example:
       * 1
       */
      id?: number; // int64
      /**
       * example:
       * Dogs
       */
      name?: string;
    }
    export interface Order {
      /**
       * example:
       * 10
       */
      id?: number; // int64
      /**
       * example:
       * 198772
       */
      petId?: number; // int64
      /**
       * example:
       * 7
       */
      quantity?: number; // int32
      shipDate?: string; // date-time
      /**
       * Order Status
       * example:
       * approved
       */
      status?: "placed" | "approved" | "delivered";
      complete?: boolean;
    }
    export interface Pet {
      /**
       * example:
       * 10
       */
      id?: number; // int64
      /**
       * example:
       * doggie
       */
      name: string;
      category?: Category;
      photoUrls: string[];
      tags?: Tag[];
      /**
       * pet status in the store
       */
      status?: "available" | "pending" | "sold";
    }
    export interface Tag {
      id?: number; // int64
      name?: string;
    }
    export interface User {
      /**
       * example:
       * 10
       */
      id?: number; // int64
      /**
       * example:
       * theUser
       */
      username?: string;
      /**
       * example:
       * John
       */
      firstName?: string;
      /**
       * example:
       * James
       */
      lastName?: string;
      /**
       * example:
       * john@email.com
       */
      email?: string;
      /**
       * example:
       * 12345
       */
      password?: string;
      /**
       * example:
       * 12345
       */
      phone?: string;
      /**
       * User Status
       * example:
       * 1
       */
      userStatus?: number; // int32
    }
  }
}
declare namespace Paths {
  namespace AddPet {
    export type RequestBody = Components.Schemas.Pet;
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export interface $400 {}
      export interface $422 {}
      export interface Default {}
    }
  }
  namespace CreateUser {
    export type RequestBody = Components.Schemas.User;
    namespace Responses {
      export type $200 = Components.Schemas.User;
      export interface Default {}
    }
  }
  namespace CreateUsersWithListInput {
    export type RequestBody = Components.Schemas.User[];
    namespace Responses {
      export type $200 = Components.Schemas.User;
      export interface Default {}
    }
  }
  namespace DeleteOrder {
    namespace Parameters {
      export type OrderId = number; // int64
    }
    export interface PathParameters {
      orderId: Parameters.OrderId /* int64 */;
    }
    namespace Responses {
      export interface $200 {}
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace DeletePet {
    export interface HeaderParameters {
      api_key?: Parameters.ApiKey;
    }
    namespace Parameters {
      export type ApiKey = string;
      export type PetId = number; // int64
    }
    export interface PathParameters {
      petId: Parameters.PetId /* int64 */;
    }
    namespace Responses {
      export interface $200 {}
      export interface $400 {}
      export interface Default {}
    }
  }
  namespace DeleteUser {
    namespace Parameters {
      export type Username = string;
    }
    export interface PathParameters {
      username: Parameters.Username;
    }
    namespace Responses {
      export interface $200 {}
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace FindPetsByStatus {
    namespace Parameters {
      export type Status = "available" | "pending" | "sold";
    }
    export interface QueryParameters {
      status: Parameters.Status;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet[];
      export interface $400 {}
      export interface Default {}
    }
  }
  namespace FindPetsByTags {
    namespace Parameters {
      export type Tags = string[];
    }
    export interface QueryParameters {
      tags: Parameters.Tags;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet[];
      export interface $400 {}
      export interface Default {}
    }
  }
  namespace GetInventory {
    namespace Responses {
      export interface $200 {
        [name: string]: number; // int32
      }
      export interface Default {}
    }
  }
  namespace GetOrderById {
    namespace Parameters {
      export type OrderId = number; // int64
    }
    export interface PathParameters {
      orderId: Parameters.OrderId /* int64 */;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Order;
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace GetPetById {
    namespace Parameters {
      export type PetId = number; // int64
    }
    export interface PathParameters {
      petId: Parameters.PetId /* int64 */;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace GetUserByName {
    namespace Parameters {
      export type Username = string;
    }
    export interface PathParameters {
      username: Parameters.Username;
    }
    namespace Responses {
      export type $200 = Components.Schemas.User;
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace LoginUser {
    namespace Parameters {
      export type Password = string;
      export type Username = string;
    }
    export interface QueryParameters {
      username?: Parameters.Username;
      password?: Parameters.Password;
    }
    namespace Responses {
      export type $200 = string;
      export interface $400 {}
      export interface Default {}
    }
  }
  namespace LogoutUser {
    namespace Responses {
      export interface $200 {}
      export interface Default {}
    }
  }
  namespace PlaceOrder {
    export type RequestBody = Components.Schemas.Order;
    namespace Responses {
      export type $200 = Components.Schemas.Order;
      export interface $400 {}
      export interface $422 {}
      export interface Default {}
    }
  }
  namespace UpdatePet {
    export type RequestBody = Components.Schemas.Pet;
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export interface $400 {}
      export interface $404 {}
      export interface $422 {}
      export interface Default {}
    }
  }
  namespace UpdatePetWithForm {
    namespace Parameters {
      export type Name = string;
      export type PetId = number; // int64
      export type Status = string;
    }
    export interface PathParameters {
      petId: Parameters.PetId /* int64 */;
    }
    export interface QueryParameters {
      name?: Parameters.Name;
      status?: Parameters.Status;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export interface $400 {}
      export interface Default {}
    }
  }
  namespace UpdateUser {
    namespace Parameters {
      export type Username = string;
    }
    export interface PathParameters {
      username: Parameters.Username;
    }
    export type RequestBody = Components.Schemas.User;
    namespace Responses {
      export interface $200 {}
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
  namespace UploadFile {
    namespace Parameters {
      export type AdditionalMetadata = string;
      export type PetId = number; // int64
    }
    export interface PathParameters {
      petId: Parameters.PetId /* int64 */;
    }
    export interface QueryParameters {
      additionalMetadata?: Parameters.AdditionalMetadata;
    }
    export type RequestBody = string; // binary
    namespace Responses {
      export type $200 = Components.Schemas.ApiResponse;
      export interface $400 {}
      export interface $404 {}
      export interface Default {}
    }
  }
}

export type UpdatePetRequestBody = Paths.UpdatePet.RequestBody;
export type UpdatePetErrorType =
  | Paths.UpdatePet.Responses.$400
  | Paths.UpdatePet.Responses.$404
  | Paths.UpdatePet.Responses.$422;
export type UpdatePetResponseType = Paths.UpdatePet.Responses.$200;

export type AddPetRequestBody = Paths.AddPet.RequestBody;
export type AddPetErrorType = Paths.AddPet.Responses.$400 | Paths.AddPet.Responses.$422;
export type AddPetResponseType = Paths.AddPet.Responses.$200;

export type FindPetsByStatusQueryParams = Paths.FindPetsByStatus.QueryParameters;
export type FindPetsByStatusErrorType = Paths.FindPetsByStatus.Responses.$400;
export type FindPetsByStatusResponseType = Paths.FindPetsByStatus.Responses.$200;

export type FindPetsByTagsQueryParams = Paths.FindPetsByTags.QueryParameters;
export type FindPetsByTagsErrorType = Paths.FindPetsByTags.Responses.$400;
export type FindPetsByTagsResponseType = Paths.FindPetsByTags.Responses.$200;

export type GetPetByIdPathParams = Paths.GetPetById.PathParameters;
export type GetPetByIdErrorType = Paths.GetPetById.Responses.$400 | Paths.GetPetById.Responses.$404;
export type GetPetByIdResponseType = Paths.GetPetById.Responses.$200;

export type UpdatePetWithFormPathParams = Paths.UpdatePetWithForm.PathParameters;
export type UpdatePetWithFormQueryParams = Paths.UpdatePetWithForm.QueryParameters;
export type UpdatePetWithFormErrorType = Paths.UpdatePetWithForm.Responses.$400;
export type UpdatePetWithFormResponseType = Paths.UpdatePetWithForm.Responses.$200;

export type DeletePetPathParams = Paths.DeletePet.PathParameters;
export type DeletePetErrorType = Paths.DeletePet.Responses.$400;
export type DeletePetResponseType = Paths.DeletePet.Responses.$200;

export type UploadFilePathParams = Paths.UploadFile.PathParameters;
export type UploadFileQueryParams = Paths.UploadFile.QueryParameters;
export type UploadFileRequestBody = Paths.UploadFile.RequestBody;
export type UploadFileErrorType = Paths.UploadFile.Responses.$400 | Paths.UploadFile.Responses.$404;
export type UploadFileResponseType = Paths.UploadFile.Responses.$200;

export type GetInventoryErrorType = undefined;
export type GetInventoryResponseType = Paths.GetInventory.Responses.$200;

export type PlaceOrderRequestBody = Paths.PlaceOrder.RequestBody;
export type PlaceOrderErrorType = Paths.PlaceOrder.Responses.$400 | Paths.PlaceOrder.Responses.$422;
export type PlaceOrderResponseType = Paths.PlaceOrder.Responses.$200;

export type GetOrderByIdPathParams = Paths.GetOrderById.PathParameters;
export type GetOrderByIdErrorType = Paths.GetOrderById.Responses.$400 | Paths.GetOrderById.Responses.$404;
export type GetOrderByIdResponseType = Paths.GetOrderById.Responses.$200;

export type DeleteOrderPathParams = Paths.DeleteOrder.PathParameters;
export type DeleteOrderErrorType = Paths.DeleteOrder.Responses.$400 | Paths.DeleteOrder.Responses.$404;
export type DeleteOrderResponseType = Paths.DeleteOrder.Responses.$200;

export type CreateUserRequestBody = Paths.CreateUser.RequestBody;
export type CreateUserErrorType = undefined;
export type CreateUserResponseType = Paths.CreateUser.Responses.$200;

export type CreateUsersWithListInputRequestBody = Paths.CreateUsersWithListInput.RequestBody;
export type CreateUsersWithListInputErrorType = undefined;
export type CreateUsersWithListInputResponseType = Paths.CreateUsersWithListInput.Responses.$200;

export type LoginUserQueryParams = Paths.LoginUser.QueryParameters;
export type LoginUserErrorType = Paths.LoginUser.Responses.$400;
export type LoginUserResponseType = Paths.LoginUser.Responses.$200;

export type LogoutUserErrorType = undefined;
export type LogoutUserResponseType = Paths.LogoutUser.Responses.$200;

export type GetUserByNamePathParams = Paths.GetUserByName.PathParameters;
export type GetUserByNameErrorType = Paths.GetUserByName.Responses.$400 | Paths.GetUserByName.Responses.$404;
export type GetUserByNameResponseType = Paths.GetUserByName.Responses.$200;

export type UpdateUserPathParams = Paths.UpdateUser.PathParameters;
export type UpdateUserRequestBody = Paths.UpdateUser.RequestBody;
export type UpdateUserErrorType = Paths.UpdateUser.Responses.$400 | Paths.UpdateUser.Responses.$404;
export type UpdateUserResponseType = Paths.UpdateUser.Responses.$200;

export type DeleteUserPathParams = Paths.DeleteUser.PathParameters;
export type DeleteUserErrorType = Paths.DeleteUser.Responses.$400 | Paths.DeleteUser.Responses.$404;
export type DeleteUserResponseType = Paths.DeleteUser.Responses.$200;

export type SdkSchema = {
  pet: {
    $put: RequestModel<{
      response: UpdatePetResponseType;
      payload: UpdatePetRequestBody;
      error: UpdatePetErrorType;
      endpoint: "/pet";
    }>;
    $post: RequestModel<{
      response: AddPetResponseType;
      payload: AddPetRequestBody;
      error: AddPetErrorType;
      endpoint: "/pet";
    }>;
    findByStatus: {
      $get: RequestModel<{
        response: FindPetsByStatusResponseType;
        queryParams: FindPetsByStatusQueryParams;
        error: FindPetsByStatusErrorType;
        endpoint: "/pet/findByStatus";
      }>;
    };
    findByTags: {
      $get: RequestModel<{
        response: FindPetsByTagsResponseType;
        queryParams: FindPetsByTagsQueryParams;
        error: FindPetsByTagsErrorType;
        endpoint: "/pet/findByTags";
      }>;
    };
    $petId: {
      $get: RequestModel<{ response: GetPetByIdResponseType; error: GetPetByIdErrorType; endpoint: "/pet/:petId" }>;
      $post: RequestModel<{
        response: UpdatePetWithFormResponseType;
        queryParams?: UpdatePetWithFormQueryParams;
        error: UpdatePetWithFormErrorType;
        endpoint: "/pet/:petId";
      }>;
      $delete: RequestModel<{ response: DeletePetResponseType; error: DeletePetErrorType; endpoint: "/pet/:petId" }>;
      uploadImage: {
        $post: RequestModel<{
          response: UploadFileResponseType;
          payload: UploadFileRequestBody;
          queryParams?: UploadFileQueryParams;
          error: UploadFileErrorType;
          endpoint: "/pet/:petId/uploadImage";
        }>;
      };
    };
  };
  store: {
    inventory: {
      $get: RequestModel<{
        response: GetInventoryResponseType;
        error: GetInventoryErrorType;
        endpoint: "/store/inventory";
      }>;
    };
    order: {
      $post: RequestModel<{
        response: PlaceOrderResponseType;
        payload: PlaceOrderRequestBody;
        error: PlaceOrderErrorType;
        endpoint: "/store/order";
      }>;
      $orderId: {
        $get: RequestModel<{
          response: GetOrderByIdResponseType;
          error: GetOrderByIdErrorType;
          endpoint: "/store/order/:orderId";
        }>;
        $delete: RequestModel<{
          response: DeleteOrderResponseType;
          error: DeleteOrderErrorType;
          endpoint: "/store/order/:orderId";
        }>;
      };
    };
  };
  user: {
    $post: RequestModel<{
      response: CreateUserResponseType;
      payload: CreateUserRequestBody;
      error: CreateUserErrorType;
      endpoint: "/user";
    }>;
    createWithList: {
      $post: RequestModel<{
        response: CreateUsersWithListInputResponseType;
        payload: CreateUsersWithListInputRequestBody;
        error: CreateUsersWithListInputErrorType;
        endpoint: "/user/createWithList";
      }>;
    };
    login: {
      $get: RequestModel<{
        response: LoginUserResponseType;
        queryParams?: LoginUserQueryParams;
        error: LoginUserErrorType;
        endpoint: "/user/login";
      }>;
    };
    logout: {
      $get: RequestModel<{ response: LogoutUserResponseType; error: LogoutUserErrorType; endpoint: "/user/logout" }>;
    };
    $username: {
      $get: RequestModel<{
        response: GetUserByNameResponseType;
        error: GetUserByNameErrorType;
        endpoint: "/user/:username";
      }>;
      $put: RequestModel<{
        response: UpdateUserResponseType;
        payload: UpdateUserRequestBody;
        error: UpdateUserErrorType;
        endpoint: "/user/:username";
      }>;
      $delete: RequestModel<{
        response: DeleteUserResponseType;
        error: DeleteUserErrorType;
        endpoint: "/user/:username";
      }>;
    };
  };
};

export type { Components };

export const createSdk = <Client extends ClientInstance>(
  client: Client,
  options?: Parameters<typeof coreCreateSdk>[1] | undefined,
) => {
  return coreCreateSdk<Client, SdkSchema>(client, options);
};
