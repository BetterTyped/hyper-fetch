/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import * as matchers from "jest-extended";
import { expect } from "vitest";

expect.extend(matchers);

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
