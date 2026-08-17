const TARGET_PICTURE_DIMENSION = 1920;

export function selectCameraPictureSize(
  availableSizes: string[],
  targetDimension = TARGET_PICTURE_DIMENSION,
): string | undefined {
  const parsed = availableSizes.flatMap((size) => {
    const match = /^(\d+)x(\d+)$/.exec(size);
    if (!match) return [];
    return [{ size, longestSide: Math.max(Number(match[1]), Number(match[2])) }];
  });

  return parsed.sort(
    (left, right) =>
      Math.abs(left.longestSide - targetDimension) -
        Math.abs(right.longestSide - targetDimension) ||
      left.longestSide - right.longestSide,
  )[0]?.size;
}
