export function getCardScrollTarget({
  cardLeft,
  cardWidth,
  maxScroll,
  scale,
  scrollLeft,
  viewportLeft,
  viewportWidth
}: {
  cardLeft: number;
  cardWidth: number;
  maxScroll: number;
  scale: number;
  scrollLeft: number;
  viewportLeft: number;
  viewportWidth: number;
}) {
  const target = scrollLeft + (cardLeft - viewportLeft) / scale - (viewportWidth - cardWidth) / 2;
  return Math.max(0, Math.min(maxScroll, target));
}

export function getClosestCard(targets: number[], scrollLeft: number) {
  return targets.reduce(
    (closest, target, index) =>
      Math.abs(target - scrollLeft) < Math.abs((targets[closest] ?? 0) - scrollLeft) ? index : closest,
    0
  );
}
