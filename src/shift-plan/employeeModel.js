import { ShiftType, Role, MaxShiftSeq } from './constants';

export default class EmployeeModel {
  constructor({
    uniqueId, index, name, role, planDayOffDates = [], maxShiftSeq = MaxShiftSeq,
  }) {
    Object.assign(this, {
      uniqueId, index, name, role, planDayOffDates, maxShiftSeq,
    });
    this.shiftSeq = 0;
    this.shifts = [];
    this.shiftTypeCount = {};
    Object.values(ShiftType).forEach((shiftTypeVal) => {
      this.shiftTypeCount[shiftTypeVal] = 0;
    });

    if (role === Role.MG) {
      this.shiftTypeCount[ShiftType.FullDay] = Number.MAX_VALUE;
      this.shiftTypeCount[ShiftType.NightShiftOvertime] = Number.MAX_VALUE;
    }
  }

  setPlanDayOffDates(dates) {
    this.planDayOffDates = dates;
  }

  isCandidate(date) {
    if (this.shiftSeq >= this.maxSeqShift || this.planDayOffDates.indexOf(date) !== -1) return false;
    return true;
  }

  setShift(date, shiftType) {
    if (shiftType === ShiftType.DayOff) this.shiftSeq = 0;
    else this.shiftSeq += 1;

    this.shifts.push(shiftType);
    this.shiftTypeCount[shiftType] += 1;
  }
}
