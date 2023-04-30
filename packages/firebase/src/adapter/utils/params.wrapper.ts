import {
  QueryEndAtConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  QueryStartAtConstraint,
  QuerySnapshot,
  QueryFieldFilterConstraint,
} from "@firebase/firestore";

type FirestoreQueryConstraints =
  | QueryOrderByConstraint
  | QueryLimitConstraint
  | QueryStartAtConstraint
  | QueryEndAtConstraint
  | QueryFieldFilterConstraint;

const firestoreConstraintStringifyMap = {
  QueryFieldFilterConstraint:
    ({ _op, _value, type }) =>
    () =>
      `${type}_${_op}_${_value}`,
  QueryOrderByConstraint:
    ({ type, _direction, _field }) =>
    () =>
      `${type}_${String(_field)}_${_direction}`,
  QueryLimitConstraint:
    ({ type, _limit, _limitType }) =>
    () =>
      `${type}_${_limit}_${_limitType}`,
  QueryStartAtConstraint: ({ type, _docOrFields }) => {
    if (_docOrFields[0] instanceof QuerySnapshot) {
      // maybe there is any other way...
      return () => `${type}_${_docOrFields[0].query?._query?.memoizedTarget?.memoizedCanonicalId}`;
    }
    return () => `${type}_${_docOrFields}`;
  },
  QueryEndAtConstraint: ({ type, _docOrFields }) => {
    if (_docOrFields[0] instanceof QuerySnapshot) {
      // maybe there is any other way...
      return () => `${type}_${_docOrFields[0].query?._query?.memoizedTarget?.memoizedCanonicalId}`;
    }
    return () => `${type}_${_docOrFields}`;
  },
};
const realtimeConstraintStringifyMap = {
  QueryOrderByChildConstraint: ({ _path }) => {
    return () => `orderByChild_${_path}`;
  },
  QueryLimitToFirstConstraint: ({ _limit }) => {
    return () => `limitToFirst_${_limit}`;
  },
  QueryStartAtConstraint: ({ _value, _key }) => {
    return () => `startAt_${_value}_${_key}`;
  },
  QueryEndAtConstraint: ({ _value, _key }) => {
    return () => `startAt_${_value}_${_key}`;
  },
};

/*
 *  Function necessary for determining some kind of default cache key for firebase constraints.
 *  String(constraint) does not yield anything else than [Object object], thus the necessity to extract some kind of
 *  deterministic data and stringify it.
 *  TODO: find a better/nicer approach
 * */
export const params = (constraints: FirestoreQueryConstraints[]) => {
  return constraints.map((param) => {
    if (param instanceof QueryFieldFilterConstraint) {
      // eslint-disable-next-line no-param-reassign
      param.toString = firestoreConstraintStringifyMap.QueryFieldFilterConstraint(param as any);
    } else if (param instanceof QueryOrderByConstraint) {
      // eslint-disable-next-line no-param-reassign
      param.toString = firestoreConstraintStringifyMap.QueryOrderByConstraint(param as any);
    } else if (param instanceof QueryLimitConstraint) {
      // eslint-disable-next-line no-param-reassign
      param.toString = firestoreConstraintStringifyMap.QueryLimitConstraint(param as any);
    } else if (param instanceof QueryStartAtConstraint) {
      // eslint-disable-next-line no-param-reassign
      param.toString = firestoreConstraintStringifyMap.QueryStartAtConstraint(param as any);
    } else if (param instanceof QueryEndAtConstraint) {
      // eslint-disable-next-line no-param-reassign
      param.toString = firestoreConstraintStringifyMap.QueryEndAtConstraint(param as any);
    }
    return param;
  });
};
