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
    this.rowLength = monthSetting.days + Object.keys(ShiftType).length + 2;
    this.colLength = employees.length + 1;
    this.dayOffTable = this._initialDayOffTable(employees, this.rowLength, this.colLength);
  }

  _initialDayOffTable(employees, rowLength, colLength) {
    const dayOffTable = Array.from(
      Array(colLength),
      () => Array(rowLength).fill(''));

    employees.forEach(emp => {
      dayOffTable[emp.index][0] = emp.name;
      emp.planDayOffDates.forEach(date => {
        this._setEmpoyeeShift(dayOffTable, emp, date, ShiftType.DayOff);
      });
    });

    return dayOffTable;
  }

  start() {
    this._preAddDayOff(this.dayOffTable, this.monthSetting, this.employees);
  }

  _preAddDayOff(dayOffTable, monthSetting, employees) {
    let beginDateOfWeekOfMonth = 1 + (7 - monthSetting.beginDay + 1);
    for (let beginDateOfWeek = beginDateOfWeekOfMonth; beginDateOfWeek < monthSetting.days; beginDateOfWeek += 7) {
      employees.forEach(emp => {
        let count = 0;
        for (let day = 0; day < 3; day++) {
          if (dayOffTable[emp.index][beginDateOfWeek + day] === ShiftType.DayOff) count++;
        }
        if (count >= 2 && beginDateOfWeek + 7 <= monthSetting.days) this._setEmpoyeeShift(dayOffTable, emp, beginDateOfWeek + 7, ShiftType.DayOff);
        count = 0;
        for (let day = 4; day < 7; day++) {
          if (dayOffTable[emp.index][beginDateOfWeek + day] === ShiftType.DayOff) count++;
        }
        if (count >= 2 && beginDateOfWeek - 1 > 0) this._setEmpoyeeShift(dayOffTable, emp, beginDateOfWeek - 1, ShiftType.DayOff);
      });
    }
  }

  _setEmpoyeeShift(dayOffTable, employee, date, shiftType) {
    dayOffTable[employee.index][date] = shiftType;
  }

  printRoster() {
    this._refreshEveryDateDayOffCount(this.dayOffTable, this.colLength);

    const docFrag = new DocumentFragment();
    this._populateRosterTableHeader(docFrag, this.monthSetting, this.rowLength);
    this._populateRosterTableBody(docFrag, this.dayOffTable);
    this._populateRosterTableFoot(docFrag, this.rowLength);
    document.querySelector("#roster").appendChild(docFrag);
  }

  _refreshEveryDateDayOffCount(dayOffTable, colLength) {
    for (let date = 1; date <= this.monthSetting.days; date += 1) {
      this._refreshDateDayOffCount(dayOffTable, date, colLength);
    }
  }

  _refreshDateDayOffCount(dayOffTable, date, colLength) {
    dayOffTable[colLength - 1][date] = 0;
    for (let col = 0; col < colLength - 1; col += 1) {
      if (dayOffTable[col][date] === ShiftType.DayOff) dayOffTable[colLength - 1][date] += 1;
    }
  }

  _populateRosterTableHeader(docFrag, monthSetting, rowLength) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = "header";
    td.colSpan = rowLength;
    tr.appendChild(td);
    thead.appendChild(tr);
    this._populateRosterTableHeaderDate(thead, monthSetting.days);
    this._populateRosterTableHeaderDay(thead, monthSetting);
    docFrag.appendChild(thead, this.rowLength);
  }

  _populateRosterTableHeaderDate(thead, days) {
    const dateTr = document.createElement("tr");
    dateTr.appendChild(document.createElement("th"));
    for (let date = 1; date <= days; date++) {
      const dateTh = document.createElement("th");
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    thead.appendChild(dateTr);
  }

  _populateRosterTableHeaderDay(thead, monthSetting) {
    const dayTr = document.createElement("tr");
    dayTr.appendChild(document.createElement("th"));
    for (let date = 1; date <= monthSetting.days; date++) {
      const dayTh = document.createElement("th");
      dayTh.innerText = monthSetting.getDay(date);
      dayTr.appendChild(dayTh);
    }
    for (let shiftType in ShiftType) {
      const th = document.createElement("th");
      th.innerText = ShiftType[shiftType];
      dayTr.appendChild(th);
    }
    const th = document.createElement("th");
    th.innerText = "職";
    dayTr.appendChild(th);
    thead.appendChild(dayTr);
  }

  _populateRosterTableBody(docFrag, tableRows) {
    const tbody = document.createElement('tbody');
    tableRows.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.innerText = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    docFrag.appendChild(tbody);
  }

  _populateRosterTableFoot(docFrag, rowLength) {
    const tfoot = document.createElement('tfoot');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = "footer";
    td.colSpan = rowLength;
    tr.appendChild(td);
    tfoot.appendChild(tr);
    docFrag.appendChild(tfoot);
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
  constructor({ index, name, planDayOffDates, role, maxSeqShift = 4 }) {
    this.index = index;
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
