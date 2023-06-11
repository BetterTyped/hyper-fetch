import { Client } from "@hyper-fetch/core";

declare namespace Components {
  namespace Schemas {
    export interface Error {
      code: number; // int32
      message: string;
    }
    export interface NewPet {
      name: string;
      tag?: string;
    }
    export interface Pet {
      name: string;
      tag?: string;
      id: number; // int64
    }
  }
}
declare namespace Paths {
  namespace AddPet {
    export type RequestBody = Components.Schemas.NewPet;
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export type Default = Components.Schemas.Error;
    }
  }
  namespace DeletePet {
    namespace Parameters {
      export type Id = number; // int64
    }
    export interface PathParameters {
      id: Parameters.Id /* int64 */;
    }
    namespace Responses {
      export interface $204 {}
      export type Default = Components.Schemas.Error;
    }
  }
  namespace FindPetById {
    namespace Parameters {
      export type Id = number; // int64
    }
    export interface PathParameters {
      id: Parameters.Id /* int64 */;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet;
      export type Default = Components.Schemas.Error;
    }
  }
  namespace FindPets {
    namespace Parameters {
      export type Limit = number; // int32
      export type Tags = string[];
    }
    export interface QueryParameters {
      tags?: Parameters.Tags;
      limit?: Parameters.Limit /* int32 */;
    }
    namespace Responses {
      export type $200 = Components.Schemas.Pet[];
      export type Default = Components.Schemas.Error;
    }
  }
}

export type FindPetsQueryParams = Paths.FindPets.QueryParameters;
export type FindPetsResponseType = Paths.FindPets.Responses.$200;

export type AddPetRequestBody = Paths.AddPet.RequestBody;
export type AddPetResponseType = Paths.AddPet.Responses.$200;

export type FindPetByIdPathParams = Paths.FindPetById.PathParameters;
export type FindPetByIdResponseType = Paths.FindPetById.Responses.$200;

export type DeletePetPathParams = Paths.DeletePet.PathParameters;
export type DeletePetResponseType = Paths.DeletePet.Responses.$204;

const client = new Client({ url: "test-base-url" });

export const findPets = client.createRequest<FindPetsResponseType, undefined, undefined, FindPetsQueryParams>()({
  method: "GET",
  endpoint: "/pets",
});

export const addPet = client.createRequest<AddPetResponseType, AddPetRequestBody, undefined, undefined>()({
  method: "POST",
  endpoint: "/pets",
});

export const findByPetId = client.createRequest<FindPetByIdResponseType, undefined, undefined, undefined>()({
  method: "GET",
  endpoint: "/pets/:id",
});

export const deletePet = client.createRequest<DeletePetResponseType, undefined, undefined, undefined>()({
  method: "DELETE",
  endpoint: "/pets/:id",
});
