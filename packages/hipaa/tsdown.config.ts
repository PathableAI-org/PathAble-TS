import { createBaseConfig } from "../../tsdown.base.config.mjs"

export default createBaseConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
})