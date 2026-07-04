import assert from "assert";

// Inline slugify implementation (plain JS, no imports)
function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Test fixtures
assert.strictEqual(
  slugify("Gunung Rinjani 🏔️ — 3,726m!"),
  "gunung-rinjani-3-726m",
  'Fixture 1 failed: "Gunung Rinjani 🏔️ — 3,726m!"'
);

assert.strictEqual(
  slugify("Pendakian Gunung Gede via Cibodas"),
  "pendakian-gunung-gede-via-cibodas",
  'Fixture 2 failed: "Pendakian Gunung Gede via Cibodas"'
);

assert.strictEqual(
  slugify("  Café Ñoño!!  "),
  "cafe-nono",
  'Fixture 3 failed: "  Café Ñoño!!  "'
);

assert.strictEqual(
  slugify("🎉🎉"),
  "",
  'Fixture 4 failed: "🎉🎉"'
);

console.log("All slugify fixtures passed ✓");
