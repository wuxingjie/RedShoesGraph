export function measureExecutionTime<T extends (...args: any[]) => any>(
  targetFunction: T,
  name?: string,
): (...args: Parameters<T>) => ReturnType<T> {
  let totalTime = 0; // 累积的执行时间
  name = name ?? targetFunction.name;
  return (...args: Parameters<T>): ReturnType<T> => {
    const start = performance.now(); // 记录开始时间
    const result = targetFunction(...args); // 执行目标函数
    const end = performance.now(); // 记录结束时间
    const timeTaken = end - start; // 计算此次执行时间
    totalTime += timeTaken; // 累加时间
    console.log(
      `${name}, Execution time: ${timeTaken} ms, Total: ${totalTime}`,
    ); // 打印执行时间
    return result; // 返回目标函数的结果
  };
}
