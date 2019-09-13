import { Day, ShiftType } from './constants';

export default class MonthData {
  constructor({ year, month, holidayOffDates = [] }) {
    this.dateObj = new Date(year, month);
    this.beginDay = this.dateObj.getDay();
    this.days = new Date(year, month + 1, 0).getDate();
    this.lastMonthDays = new Date(year, month, 0).getDate();
    this.holidayOffDates = holidayOffDates;
    this.nextMonthFirstWeekDays = this.getNextMonthFirstWeekDays();
    this.lastMonthLastWeekDays = this.getLastMonthLastWeekDays();
  }

  getShifts(date) {
    if (this.isWeekend(date) || this.holidayOffDates.indexOf(date) !== -1) {
      return [ShiftType.FullDay, ShiftType.NightShiftOvertime, ShiftType.MoringShift, ShiftType.NightShift];
    }
    return [ShiftType.NightShiftOvertime, ShiftType.MoringShift, ShiftType.MoringShift, ShiftType.NightShift];
  }

  isWeekend(date) {
    const day = (this.beginDay + date - 1) % 7;
    return day === 0 || day === 6;
  }

  getDay(date) {
    const day = (this.beginDay + date - 1) % 7;
    return Day[day];
  }

  getNextMonthFirstWeekDays() {
    return 7 - ((this.beginDay + this.days - 1) % 7);
  }

  getLastMonthLastWeekDays() {
    return this.beginDay - 1;
  }
}
