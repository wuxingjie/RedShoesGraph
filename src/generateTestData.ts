export function getRandomDateFn(startDate: Date, endDate: Date): () => Date {
  // 将日期转换为时间戳
  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();
  return () => {
    // 生成一个随机的时间戳
    const randomTimestamp =
      Math.random() * (endTimestamp - startTimestamp) + startTimestamp;

    // 将随机的时间戳转换为日期对象
    return new Date(randomTimestamp);
  };
}

export function getRandomDate(startDate: Date, endDate: Date) {
  return getRandomDateFn(startDate, endDate)();
}

export function getRandomId(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
