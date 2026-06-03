export type WeightedOption<T> = Readonly<{
  weight: number;
  option: T;
}>;

type RandomSource = () => number;

export function weightedRandom<T>(
  weightedOptions: readonly WeightedOption<T>[],
  random: RandomSource = Math.random,
): T {
  if (weightedOptions.length === 0) {
    throw new Error("weightedRandom requires at least one option");
  }

  let totalWeight = 0;

  for (const { weight } of weightedOptions) {
    if (!Number.isFinite(weight)) {
      throw new Error("weightedRandom requires finite weights");
    }

    if (weight < 0) {
      throw new Error("weightedRandom requires non-negative weights");
    }

    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    throw new Error("weightedRandom requires at least one positive weight");
  }

  const randomRatio = random();

  if (
    !Number.isFinite(randomRatio) ||
    randomRatio < 0 ||
    randomRatio >= 1
  ) {
    throw new Error("weightedRandom random source must return [0, 1)");
  }

  const targetWeight = randomRatio * totalWeight;
  let cumulativeWeight = 0;
  let fallbackOption = weightedOptions[0].option;

  for (const { option, weight } of weightedOptions) {
    if (weight <= 0) {
      continue;
    }

    fallbackOption = option;
    cumulativeWeight += weight;

    if (targetWeight < cumulativeWeight) {
      return option;
    }
  }

  return fallbackOption;
}
