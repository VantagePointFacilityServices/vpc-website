import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const workerCopy = JSON.parse(readFileSync(join(repo, "worker/pricing-data.json"), "utf8"));

function siteObject() {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(join(repo, "site/assets/js/pricing-data.js"), "utf8"), sandbox);
  return sandbox.window.VPC_PRICING;
}

const SPEC_REL = "residential/docs/specs/residential-pricing.json";
const vposPath = process.env.VPOS_PRICING_PATH || resolve(repo, "../vpos", SPEC_REL);
const { source_commit, ...workerData } = workerCopy;

describe("pricing data parity", () => {
  it("Worker data copy deep-equals the site data script", () => {
    expect(siteObject()).toEqual(workerCopy);
    expect(typeof source_commit).toBe("string");
  });

  if (existsSync(vposPath)) {
    it("both copies deep-equal the vpos pricing file (ignoring source_commit)", () => {
      const vpos = JSON.parse(readFileSync(vposPath, "utf8"));
      expect(workerData).toEqual(vpos);
      const { source_commit: _s, ...siteData } = siteObject();
      expect(siteData).toEqual(vpos);
    });
  } else {
    it.skip(`SKIPPED cross-repo parity: vpos pricing file not found at ${vposPath} (set VPOS_PRICING_PATH)`, () => {});
    console.warn(`[parity] SKIPPED cross-repo check: no vpos pricing file at ${vposPath}`);
  }
});
