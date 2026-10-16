import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const file = fileURLToPath(
  new URL("../zones/vantagepointcleaning.com.au.yaml", import.meta.url),
);
const text = readFileSync(file, "utf8");
const { records } = parse(text);
const txt = (name) =>
  records.filter((r) => r.type === "TXT" && r.name === name);

describe("vantagepointcleaning.com.au zone file", () => {
  it("has the live Google DKIM record", () => {
    const r = txt("google._domainkey.vantagepointcleaning.com.au");
    expect(r).toHaveLength(1);
    expect(r[0].content).toMatch(/^"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEF/);
    expect(r[0].content).toMatch(/IDAQAB"$/);
  });

  it("has the live strict DMARC record", () => {
    const r = txt("_dmarc.vantagepointcleaning.com.au");
    expect(r).toHaveLength(1);
    expect(r[0].content).toBe(
      '"v=DMARC1; p=reject; rua=mailto:blake@vantagepointcleaning.com.au, mailto:dmarc@vantagepointcleaning.com.au; pct=10; adkim=s; aspf=s"',
    );
  });

  it("has exactly one SPF record", () => {
    const spf = txt("vantagepointcleaning.com.au").filter((r) =>
      r.content.includes("v=spf1"),
    );
    expect(spf).toHaveLength(1);
    expect(spf[0].content).toBe('"v=spf1 include:_spf.google.com ~all"');
  });

  it("keeps website records unproxied", () => {
    const a = records.filter(
      (r) => r.type === "A" && r.name === "vantagepointcleaning.com.au",
    );
    const www = records.filter(
      (r) => r.type === "CNAME" && r.name === "www.vantagepointcleaning.com.au",
    );
    expect(a).toHaveLength(4);
    expect(www).toHaveLength(1);
    for (const r of [...a, ...www]) expect(r.proxied).toBe(false);
  });

  it("header reflects Cloudflare nameservers and points to the runbook", () => {
    const header = text.split("zone:")[0];
    expect(header).toMatch(/Cloudflare/);
    expect(header).toMatch(/docs\/DEPLOYMENT\.md Part 3/);
    expect(header).not.toMatch(/NOT APPLIED/);
  });
});
