const Role = {
  PT: '兼',
  FT: '正',
  MG: '店',
}

const ShiftType = {
  MoringShift: "1",
  NightShift: "2",
  NightShiftOvertime: "2+",
  FullDay: "全",
  DayOff: "X"
}

const Day = {
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  0: "日",
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
      const shiftTypes = this.monthSetting.getShifts(date);
      shiftTypes.forEach(shiftType => {
        let shiftTypeCandidates = candidates;
        if (shiftType === ShiftType.FullDay || shiftType === ShiftType.NightShiftOvertime) {
          shiftTypeCandidates = this.getLowestShiftTypeCountCandidates(shiftTypeCandidates, shiftType);
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

  getLowestShiftTypeCountCandidates(candidates, shiftType) {
    let result = [];
    let minCount = Number.MAX_VALUE;
    candidates.filter(c => c.role !== Role.MG).forEach(candidate => {
      if (minCount > candidate.shiftTypeCount[shiftType]) {
        result = [candidate];
        minCount = candidate.shiftTypeCount[shiftType];
      } else {
        result.push(candidate);
      }
    });
    return result;
  }

  getRandomOneFromItems(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  printRoster() {
    const tableRows = this.employees.map(employee => {
      const row = { name: employee.name };
      for (let date = 1; date <= this.monthSetting.days; date++) {
        row[date] = employee.shifts[date - 1];
      }
      for (let shiftType in ShiftType) {
        row[shiftType] = employee.shiftTypeCount[ShiftType[shiftType]];
      }
      row.role = employee.role;
      return row;
    });

    const docFrag = new DocumentFragment();

    this.populateRosterTableHeader(docFrag);

    tableRows.forEach(row => {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.innerText = row.name;
      tr.appendChild(td);

      for (let key in row) {
        if (key === 'name') continue;
        const td = document.createElement("td");
        if (row.role === Role.MG && (key === 'NightShiftOvertime' || key === 'FullDay')) {
          td.innerText = 'X';
        } else {
          td.innerText = row[key];
        }
        tr.appendChild(td);
      }
      docFrag.appendChild(tr);
    });
    const tableDom = document.querySelector("#roster");
    tableDom.appendChild(docFrag);
  }

  populateRosterTableHeader(docFrag) {
    const dateTr = document.createElement("tr");
    const dayTr = document.createElement("tr");
    dateTr.appendChild(document.createElement("th"));
    dayTr.appendChild(document.createElement("th"));
    for (let date = 1; date <= this.monthSetting.days; date++) {
      const dateTh = document.createElement("th");
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);

      const dayTh = document.createElement("th");
      dayTh.innerText = this.monthSetting.getDay(date);
      dayTr.appendChild(dayTh);
    }
    for (let shiftType in ShiftType) {
      const th = document.createElement("th");
      th.innerText = ShiftType[shiftType];
      dayTr.appendChild(th);
      dateTr.appendChild(document.createElement("th"));
    }
    const th = document.createElement("th");
    th.innerText = "職";
    dayTr.appendChild(th);
    dateTr.appendChild(document.createElement("th"));
    docFrag.appendChild(dateTr);
    docFrag.appendChild(dayTr);
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

  getDay(date) {
    const day = (this.beginDay + date - 1) % 7;
    return Day[day];
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
