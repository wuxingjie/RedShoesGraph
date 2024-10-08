import * as d3 from "d3";

d3.timeFormatDefaultLocale({
  dateTime: "%x, %X",
  date: "%Y-%-m-%-d",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  shortDays: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  months: [
    "一月",
    "二月",
    "三月",
    "四月",
    "五月",
    "六月",
    "七月",
    "八月",
    "九月",
    "十月",
    "十一月",
    "十二月",
  ],
  shortMonths: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
});
