

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

  // Step 2: Proportional insertion
  const proportionGaps = gaps.filter((g) => g.gap >= 3);
  const totalInsertableSlots = proportionGaps.reduce(
    (sum, g) => sum + (g.gap - 1),
    0,
  );

  const insertPlan = [];

  for (const { start, end, gap } of proportionGaps) {
    const insertableSlots = gap - 1;
    const proportionalShare = Math.floor(
      (insertableSlots / totalInsertableSlots) * remaining,
    );
    insertPlan.push({ start, end, insertCount: proportionalShare });
  }

  // Calculate total inserted so far and fix under-allocation
  let used = insertPlan.reduce((sum, g) => sum + g.insertCount, 0);
  let deficit = remaining - used;

  // Distribute remaining slots one by one to gaps that can still take more
  for (let i = 0; i < insertPlan.length && deficit > 0; i++) {
    const g = insertPlan[i];
    const maxInsertable = g.end - g.start - 1;
    if (g.insertCount < maxInsertable) {
      g.insertCount++;
      deficit--;
    }
  }

  // Now insert into actual positions
  for (const { start, end, insertCount } of insertPlan) {
    const step = (end - start) / (insertCount + 1);
    for (let i = 1; i <= insertCount; i++) {
      const power = Math.round(start + step * i);
      if (
        !blankPowers.has(power) &&
        !sorted.includes(power) &&
        blankPowers.size < maxBlankCards
      ) {
        blankPowers.add(power);
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
