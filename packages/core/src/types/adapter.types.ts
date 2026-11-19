import type { Adapter, AdapterInstance } from "adapter";

export type ExtractAdapterOptionsType<T> =
  T extends Adapter<infer O, any, any, any, any, any, any, any, any, any, any, any> ? O : never;
export type ExtractAdapterMethodType<T> =
  T extends Adapter<any, infer M, any, any, any, any, any, any, any, any, any, any> ? M : never;
export type ExtractAdapterStatusType<T> =
  T extends Adapter<any, any, infer S, any, any, any, any, any, any, any, any, any> ? S : never;
export type ExtractAdapterExtraType<T> =
  T extends Adapter<any, any, any, infer A, any, any, any, any, any, any, any, any> ? A : never;
export type ExtractAdapterQueryParamsType<T> =
  T extends Adapter<any, any, any, any, infer Q, any, any, any, any, any, any, any> ? Q : never;
export type ExtractAdapterDefaultQueryParamsType<T> =
  T extends Adapter<any, any, any, any, any, infer Q, any, any, any, any, any, any> ? Q : never;
export type ExtractAdapterEndpointType<T> =
  T extends Adapter<any, any, any, any, any, any, infer E, any, any, any, any, any> ? E : never;
export type ExtractAdapterEndpointMapperType<T> =
  T extends Adapter<any, any, any, any, any, any, any, infer EM, any, any, any, any> ? EM : never;
export type ExtractAdapterQueryParamsMapperType<T> =
  T extends Adapter<any, any, any, any, any, any, any, any, infer QPM, any, any, any> ? QPM : never;
export type ExtractAdapterHeaderMapperType<T> =
  T extends Adapter<any, any, any, any, any, any, any, any, any, infer HM, any, any> ? HM : never;
export type ExtractAdapterPayloadMapperType<T> =
  T extends Adapter<any, any, any, any, any, any, any, any, any, any, infer PM, any> ? PM : never;
/** `any` (e.g. `AdapterInstance`) resolves to `{}`, otherwise it would erase the type of the whole `createRequest` params */
export type ExtractAdapterRequestOptionsType<T> =
  T extends Adapter<any, any, any, any, any, any, any, any, any, any, any, infer RO>
    ? 0 extends 1 & RO
      ? {}
      : RO
    : never;

type UnionToIntersection<Union> = (Union extends unknown ? (value: Union) => void : never) extends (
  value: infer Intersection,
) => void
  ? Intersection
  : never;

/** `true` for a union of adapters. A single adapter type equals its own intersection, which is checked by identity. */
type IsAdapterUnion<AdapterType> = [AdapterType] extends [UnionToIntersection<AdapterType>] ? false : true;

/**
 * Special type only for selecting appropriate AdapterType union version (check FirebaseAdapterType).
 *
 * A single adapter is returned as it is. Picking it with `Extract` would compare the whole `Adapter` class structurally,
 * reaching through the client and request types - deep enough to hit the instantiation limit of tsgo in
 * `createRequest()()` for custom adapters.
 */
export type ExtractUnionAdapter<
  AdapterType extends AdapterInstance,
  Values extends {
    method?: any;
    options?: any;
    status?: any;
    extra?: any;
    queryParams?: any;
    endpointType?: any;
    defaultQueryParams?: any;
  },
> =
  IsAdapterUnion<AdapterType> extends false
    ? AdapterType
    : Extract<
          AdapterType,
          Adapter<
            Values["options"],
            Values["method"],
            Values["status"],
            Values["extra"],
            Values["queryParams"],
            Values["defaultQueryParams"],
            Values["endpointType"]
          >
        > extends AdapterInstance
      ? Extract<
          AdapterType,
          Adapter<
            Values["options"],
            Values["method"],
            Values["status"],
            Values["extra"],
            Values["queryParams"],
            Values["defaultQueryParams"],
            Values["endpointType"]
          >
        >
      : never;
