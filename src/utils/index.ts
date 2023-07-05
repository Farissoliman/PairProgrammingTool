export function sum<T>(arr: T[], getter: (arg0: T) => number) {
  let sum = 0;
  for (const item of arr) {
    sum += getter(item);
  }
  return sum;
}

export function durationString(millis: number) {
  let seconds = Math.floor(millis / 1000);
  let negative = seconds < 0;
  if (negative) {
    seconds = -seconds;
  }

  const hh = Math.floor(seconds / 60 / 60);
  const mm = Math.floor((seconds % 3600) / 60);
  const ss = seconds % 60;

  return (
    (negative ? "-" : "") +
    [hh, mm, ss]
      .map((component) => component.toString().padStart(2, "0"))
      .join(":")
      .replace(/^00:/, "")
  ); // remove "00:" at the beginning if a duration has 0 hours
}
