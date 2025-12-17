export function distributeBlankCards(realItems, maxBlankCards = 9) {
  // 1. Sort real items by exponent
  const real = realItems
    .filter((i) => typeof i.exponent === "number")
    .sort((a, b) => a.exponent - b.exponent);

  const blanks = [];
  let remaining = maxBlankCards;

  // Helper to safely insert a blank
  const insertBlank = (power) => {
    if (
      remaining > 0 &&
      !blanks.some((b) => b.power === power) &&
      !real.some((r) => r.exponent === power)
    ) {
      blanks.push({ type: "blank", power });
      remaining--;
    }
  };

  // ------------------------------------------------
  // PASS 1: gaps of 1–2 → fill all missing powers
  // ------------------------------------------------
  for (let i = 0; i < real.length - 1 && remaining > 0; i++) {
    const start = real[i].exponent;
    const end = real[i + 1].exponent;
    const gap = end - start - 1;

    if (gap > 0 && gap <= 2) {
      for (let p = start + 1; p < end && remaining > 0; p++) {
        insertBlank(p);
      }
    }
  }

  // ------------------------------------------------
  // PASS 2: gaps of 3–4 → insert every 2nd power
  // ------------------------------------------------
  for (let i = 0; i < real.length - 1 && remaining > 0; i++) {
    const start = real[i].exponent;
    const end = real[i + 1].exponent;
    const gap = end - start - 1;

    if (gap >= 3 && gap <= 4) {
      for (let p = start + 1; p < end && remaining > 0; p += 2) {
        insertBlank(p);
      }
    }
  }

  // ------------------------------------------------
  // PASS 3: gaps ≥ 5 → sparse, evenly spread
  // ------------------------------------------------
  for (let i = 0; i < real.length - 1 && remaining > 0; i++) {
    const start = real[i].exponent;
    const end = real[i + 1].exponent;
    const gap = end - start - 1;

    if (gap >= 5) {
      const step = Math.ceil(gap / 3); // sparse but ordered
      for (
        let p = start + step;
        p < end && remaining > 0;
        p += step
      ) {
        insertBlank(p);
      }
    }
  }

  // ------------------------------------------------
  // Combine real + blank items
  // ------------------------------------------------
  return [
    ...real.map((item) => ({
      ...item,
      type: "real",
      power: item.exponent,
    })),
    ...blanks,
  ].sort((a, b) => a.power - b.power);
}
