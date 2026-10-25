// Read-only product regression. No edits to the REDcowork-derived source.
import assert from "node:assert/strict";
import fs from "node:fs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.TEST_URL || "http://127.0.0.1:8804/grounded-choice/";
const out = process.env.EVIDENCE_DIR || "/tmp/grounded-suite";
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const errors = [],
  external = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("request", (r) => {
  if (
    !r.url().startsWith("data:") &&
    !r.url().startsWith("blob:") &&
    new URL(r.url()).origin !== new URL(base).origin
  )
    external.push(r.url());
});
const act = (name) => p.locator(`[data-action="${name}"]`);
async function state() {
  return p.evaluate(async (base) => {
    const s = (await import(base + "js/state.js")).getState();
    return {
      view: s.view,
      scenarioId: s.scenarioId,
      selected: [...s.selected],
      selectedPlan: s.selectedPlan,
      keyChoice: s.keyChoice,
      applied: [...s.appliedConditions],
    };
  }, base);
}
async function widthCheck() {
  for (const width of [1440, 768, 390, 360]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.waitForFunction(
      () => document.documentElement.scrollWidth <= innerWidth,
    );
  }
  await p.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await p.goto(base);
  await act("scroll-to-scenes").waitFor();
  await widthCheck();
  await act("scroll-to-scenes").click();
  assert.equal(await p.locator(".scene-card").count(), 2);
  assert.equal((await state()).view, "home");
  for (const scenario of ["travel", "vacuum"]) {
    await p.goto(base);
    await p
      .locator(`[data-action="enter-scenario"][data-sc="${scenario}"]`)
      .click();
    let s = await state();
    assert.equal(s.scenarioId, scenario);
    assert.equal(s.keyChoice, null);
    assert.equal(s.selectedPlan, null);
    assert.equal(s.selected.length, scenario === "travel" ? 8 : 6);
    const titles = await p.locator(".material h3").allTextContents();
    assert.equal(titles.length, scenario === "travel" ? 8 : 6);
    assert.equal(titles.length, new Set(titles).size);
    await act("select-none").click();
    assert.ok(await act("analyze").isDisabled());
    await act("select-all").click();
    await act("analyze").click();
    await act("key-choice").first().waitFor();
    assert.ok(await act("goto-deliberation").isDisabled());
    const refs = act("open-source");
    if (await refs.count()) {
      await refs.first().click();
      await p.locator("#drawer-root.open .drawer").waitFor();
      assert.match(await p.locator(".drawer").innerText(), /材料|来源/);
      await p.keyboard.press("Escape");
      await p.locator(".drawer").waitFor({ state: "detached" });
    }
    await act("key-choice").first().click();
    await act("goto-deliberation").click();
    s = await state();
    assert.equal(s.selectedPlan, null);
    await p
      .locator('[data-action="select-plan"][data-plan="B"]')
      .first()
      .click();
    assert.equal((await state()).selectedPlan, "B");
    await p
      .locator('[data-action="open-evidence"][data-plan="B"]')
      .first()
      .click();
    await p.locator("#drawer-root.open .drawer").waitFor();
    await p.keyboard.press("Escape");
    await act("confirm-plan").click();
    assert.equal((await state()).view, "decision");
    await widthCheck();
    const conditions = act("condition");
    if (await conditions.count()) {
      await conditions.first().click();
      assert.equal((await state()).applied.length, 0);
      await act("apply-condition").click();
      assert.equal((await state()).applied.length, 1);
      await act("withdraw-condition").click();
      assert.equal((await state()).applied.length, 0);
    }
    if (scenario === "vacuum") {
      assert.match(
        await p.locator(".price-compare").innerText(),
        /暂无比较结果/,
      );
      await p.locator('[data-platform="jd"]').fill("2500");
      await p.locator('[data-platform="tb"]').fill("2400");
      assert.match(await p.locator(".pc-result").innerText(), /2400/);
      assert.match(await p.locator(".pc-result").innerText(), /淘宝/);
      assert.match(await p.locator(".pc-disclaimer").innerText(), /虚构型号/);
    } else assert.equal(await p.locator(".price-compare").count(), 0);
    await act("check").first().check();
    await act("open-card").click();
    await p.locator("#modal-root.open .modal-card").waitFor();
    await p.waitForFunction(
      () =>
        Number(
          getComputedStyle(document.querySelector(".modal-card")).opacity,
        ) === 1,
    );
    assert.match(await p.locator(".modal-card").innerText(), /方案 B/);
    await p.locator(".modal-card").screenshot({
      path: out + "/" + scenario + "-card.png",
      animations: "disabled",
    });
    const pending = p.waitForEvent("download");
    await act("download-card").click();
    const d = await pending;
    const file = out + "/" + scenario + "-" + d.suggestedFilename();
    await d.saveAs(file);
    const bytes = fs.readFileSync(file);
    if (file.endsWith(".png")) {
      assert.equal(bytes.subarray(1, 4).toString(), "PNG");
      assert.ok(bytes.length > 10000);
    } else {
      assert.match(bytes.toString(), /<svg/);
      assert.match(bytes.toString(), /方案 B/);
    }
    await p.keyboard.press("Escape");
    await p.locator(".modal-card").waitFor({ state: "detached" });
    await p.setViewportSize({ width: 390, height: 1000 });
    await p.screenshot({
      path: out + "/" + scenario + "-mobile.png",
      fullPage: true,
    });
    await act("restart").click();
    assert.equal((await state()).view, "home");
    assert.equal((await state()).selectedPlan, null);
    assert.equal((await state()).applied.length, 0);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    "PASS: both scenes, distinct materials, empty-selection gate, key-question gate, source/evidence drawers and Escape, explicit plan choice, condition preview/apply/undo, manual price comparison, checklist, real PNG/SVG download, reset and 4 widths; source unchanged, no external requests.",
  );
} finally {
  await b.close();
}
