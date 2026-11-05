import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { createRequire } from "module";

const req = createRequire(import.meta.url);
const FapPageData = req("../../../lib/fap-page-data.js");
FapPageData.forms = req("../../../lib/fap-form-reader.js");

if (typeof window !== "undefined") {
  (window as any).FapPageData = FapPageData;
}

afterEach(() => {
  cleanup();
});
