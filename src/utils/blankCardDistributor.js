export function distributeBlankCards(realItems, maxBlankCards = 9) {
  const realExponents = realItems
    .filter((item) => item.exponent !== null && !isNaN(item.exponent))
    .map((item) => item.exponent);

  const sorted = [...new Set(realExponents)].sort((a, b) => a - b);
  const blankPowers = new Set();
  const gaps = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    const gap = end - start;

    if (gap <= 1) continue;
    gaps.push({ start, end, gap });
  }

  let remaining = maxBlankCards;

  // Step 1: Fill small gaps (gap === 2)
  for (const { start, end, gap } of gaps.filter((g) => g.gap === 2)) {
    const power = start + 1;
    if (!blankPowers.has(power) && remaining > 0) {
      blankPowers.add(power);
      remaining--;
    }
  }

  // Step 2: Proportional insertion for medium (3–4) and large (≥5) gaps
  const proportionGaps = gaps.filter((g) => g.gap >= 3);
  const totalInsertableSlots = proportionGaps.reduce(
    (sum, g) => sum + (g.gap - 1),
    0,
  );

  for (const { start, end, gap } of proportionGaps) {
    if (remaining <= 0) break;

    const insertableSlots = gap - 1;
    const proportionalShare = Math.round(
      (insertableSlots / totalInsertableSlots) * remaining,
    );
    const insertCount = Math.min(proportionalShare, remaining);

    const step = (end - start) / (insertCount + 1);

    for (let i = 1; i <= insertCount; i++) {
      const power = Math.round(start + step * i);
      if (!blankPowers.has(power) && !sorted.includes(power) && remaining > 0) {
        blankPowers.add(power);
        remaining--;
      }
    }
  }

  // Combine real and blank items
  const allItems = [
    ...realItems.map((item) => ({
      ...item,
      type: "real",
      power: item.exponent,
    })),
    ...[...blankPowers].map((power) => ({
      type: "blank",
      power,
    })),
  ];

  return allItems.sort((a, b) => a.power - b.power);
}
