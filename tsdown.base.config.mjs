/** @param {Partial<import("tsdown").UserConfig>} overrides */
export function createBaseConfig(overrides = {}) {
  return {
    clean: true,
    sourcemap: true,
    ...overrides,
  }
}