import { TOKEN_STORAGE_FIELD } from "tests/config/token.config";

export const setToken = (): void => {
  window.localStorage.setItem(TOKEN_STORAGE_FIELD, "fakeToken");
};
