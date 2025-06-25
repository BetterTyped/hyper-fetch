export const getAnimationValue = (columns: number, value: number, index: number) => {
  return value * (index - columns * Math.floor(index / columns));
};
