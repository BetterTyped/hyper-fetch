/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Asserted types do not match
 */
type NOT_MATCHING = "Asserted type does not match the expected type";

export const expectType = <In>(_value?: In) => {
  return { assert: <Out>(assertedType: Out extends In ? Out : NOT_MATCHING) => assertedType };
};

export const expectNotType = <In>(_value?: In) => {
  return { assert: <Out>(assertedType: Out extends In ? NOT_MATCHING : Out) => assertedType };
};

export const expectFunctionParametersType = <In extends (...args: any) => any>(_fn?: In) => {
  return {
    assert: <Out extends Array<any>>(assertedType: Out extends Parameters<In> ? Out : NOT_MATCHING) => assertedType,
  };
};

export const expectNotFunctionParametersType = <In extends (...args: any) => any>(_fn?: In) => {
  return {
    assert: <Out extends Array<any>>(assertedType: Out extends Parameters<In> ? NOT_MATCHING : Out) => assertedType,
  };
};

export const expectFunctionReturnType = <In extends (...args: any) => any>(_fn?: In) => {
  return {
    assert: <Out>(assertedType: Out extends ReturnType<In> ? Out : NOT_MATCHING) => assertedType,
  };
};

export const expectNotFunctionReturnType = <In extends (...args: any) => any>(_fn?: In) => {
  return {
    assert: <Out>(assertedType: Out extends ReturnType<In> ? NOT_MATCHING : Out) => assertedType,
  };
};
