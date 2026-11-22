import type { DbMethods } from "@hyper-fetch/db";
import type { ReactNode } from "react";
import React, { useContext } from "react";

const DbContext = React.createContext<DbMethods | null>(null);

export type DbProviderProps = {
  /** The db components read with `useDb`. On the server, create one per request. */
  db: DbMethods;
  children?: ReactNode;
};

/**
 * Gives components a `@hyper-fetch/db` db. A server creates one db per request, so one user's rows never reach another
 * user's render, and a client hydrates its db with `createDb(collections, { state })`. A client-only app may keep a
 * module-level db instead.
 *
 * @example
 * <DbProvider db={db}>
 *   <App />
 * </DbProvider>
 */
export const DbProvider = ({ db, children }: DbProviderProps) => {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
};

/**
 * Reads the db of the nearest `DbProvider`. Pass the db's type, as in `useDb<AppDb>()` with
 * `type AppDb = ReturnType<typeof createAppDb>`.
 *
 * @example
 * const db = useDb<AppDb>();
 * const { data } = useLiveQuery(db.post.where((post) => eq(post.teamId, teamId)));
 */
export const useDb = <Db extends DbMethods = DbMethods>(): Db => {
  const db = useContext(DbContext);
  if (!db) {
    throw new Error("useDb needs a DbProvider above the component");
  }
  return db as Db;
};
