const Role = {
  PT: Symbol('part-time'),
  FT: Symbol('full-time'),
  MG: Symbol('manager'),
}

const ShiftType = {
  MoringShift: Symbol("morning shift"),
  NightShift: Symbol("night shift"),
  NightShiftOvertime: Symbol("night shift overtime"),
  FullDay: Symbol("full day"),
  DayOff: Symbol("day off")
}

class ShiftPlan {
  constructor(monthSetting, employees) {
    this.monthSetting = monthSetting;
    this.employees = employees;
  }

  start() {
    for (let date = 1; date <= this.monthSetting.days; date++) {
      const candidates = this.employees.filter(employee => {
        if (!employee.isCandidate(date)) {
          employee.setShift(date, ShiftType.DayOff);
          return false;
        }
        return true;
      });
      if (candidates.length < 4) {
        this.printRoster();
        throw "oops";
      }
      const shiftTypes = this.monthSetting.getShifts(date);
      shiftTypes.forEach(shiftType => {
        let shiftTypeCandidates = candidates;
        if (shiftType === shiftType.FullDay || shiftType === shiftType.NightShiftOvertime) {
          shiftTypeCandidates = getLowestShiftTypeCountCandidates(candidates, shiftType);
        }
        const chosen = this.getRandomOneFromItems(shiftTypeCandidates);
        chosen.setShift(date, shiftType);
        candidates.splice(candidates.indexOf(chosen), 1);
      });
      candidates.forEach(candidate => {
        candidate.setShift(date, ShiftType.DayOff);
      });
    }
  }

  printRoster() {
    const out = this.employees.map(employee => {
      const rowData = { name: employee.name };
      for (let date = 1; date <= this.monthSetting.days; date++) {
        rowData[date] = employee.shifts[date - 1].toString();
      }
      for (let shiftType in ShiftType) {
        rowData[shiftType] = employee.shiftTypeCount[ShiftType[shiftType]];
      }
      return rowData;
    });
    console.table(out);
  }

  getLowestShiftTypeCountCandidates(candidates, shiftType) {
    const result = [];
    const minCount = Number.MAX_VALUE;
    candidates.forEach(candidate => {
      if (minCount > candidate.shiftTypeCount[shiftType]) {
        result = [candidate];
      } else {
        result.push(candidate);
      }
    });
    return result;
  }

  getRandomOneFromItems(items) {
    return items[Math.floor(Math.random() * items.length)];
  }
}

class MonthSetting {
  constructor({ beginDay, days, daysOff, holidayOffDates }) {
    this.beginDay = beginDay;
    this.days = days;
    this.daysOff = daysOff;
    this.holidayOffDates = holidayOffDates;
  }

  getShifts(date) {
    if (this.isWeekend(date) || this.holidayOffDates.indexOf(date) !== -1) {
      return [ShiftType.FullDay, ShiftType.NightShiftOvertime, ShiftType.MoringShift, ShiftType.NightShift];
    } else {
      return [ShiftType.NightShiftOvertime, ShiftType.MoringShift, ShiftType.MoringShift, ShiftType.NightShift];
    }
  }

  isWeekend(date) {
    const day = (this.beginDay + date - 1) % 7;
    return day === 0 || day === 6;
  }
}

class Employee {
  constructor({ name, planDayOffDates, role, maxSeqShift = 4 }) {
    this.name = name;
    this.planDayOffDates = planDayOffDates;
    this.role = role;
    this.maxSeqShift = maxSeqShift;
    this.shiftSeq = 0;
    this.shifts = [];
    this.shiftTypeCount = {};
    for (let key in ShiftType) {
      this.shiftTypeCount[ShiftType[key]] = 0;
    }
    if (role === Role.MG) {
      this.shiftTypeCount[ShiftType.FullDay] = Number.MAX_VALUE;
      this.shiftTypeCount[ShiftType.NightShiftOvertime] = Number.MAX_VALUE;
    }
  }

  isCandidate(date) {
    if (this.shiftSeq >= this.maxSeqShift || this.planDayOffDates.indexOf(date) != -1) return false;
    return true;
  }

  setShift(date, shiftType) {
    if (shiftType === ShiftType.DayOff) this.shiftSeq = 0;
    else this.shiftSeq += 1;

    this.shifts.push(shiftType);
    this.shiftTypeCount[shiftType] += 1;
  }
}

const monthSetting = new MonthSetting({ beginDay: 7, days: 31, daysOff: 9, holidayOffDates: [1] });
const employees = [];
employees.push(new Employee({ name: 'A', planDayOffDates: [], role: Role.MG }));
employees.push(new Employee({ name: 'B', planDayOffDates: [], role: Role.FT }));
employees.push(new Employee({ name: 'C', planDayOffDates: [], role: Role.FT }));
employees.push(new Employee({ name: 'D', planDayOffDates: [], role: Role.FT }));
employees.push(new Employee({ name: 'E', planDayOffDates: [], role: Role.PT }));
employees.push(new Employee({ name: 'F', planDayOffDates: [], role: Role.PT }));

const shiftPlan = new ShiftPlan(monthSetting, employees);
shiftPlan.start();
shiftPlan.printRoster();
