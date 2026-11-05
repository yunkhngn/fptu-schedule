import { boot } from "./boot";

export { boot };

if (typeof window !== "undefined") {
  boot();
}
