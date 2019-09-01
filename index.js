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
  7: "日"
}

const MaxShiftSeq = 4;

class ShiftPlan {
  constructor(monthSetting, employees) {
    this.monthSetting = monthSetting;
    this.employees = employees;
    this.rowLength = 1 + monthSetting.lastMonthLastWeekDays + monthSetting.days + monthSetting.nextMonthFirstWeekDays + Object.keys(ShiftType).length + 1;
    this.colLength = employees.length + 1;
    this.dayOffTable = this._initialDayOffTable(employees, this.monthSetting, this.rowLength, this.colLength);
    this.origDayOffTable = this._initialDayOffTable(employees, this.monthSetting, this.rowLength, this.colLength);
  }

  _initialDayOffTable(employees, monthSetting, rowLength, colLength) {
    const dayOffTable = Array.from(
      Array(colLength),
      () => Array(rowLength).fill(''));

    for (let row = 1; row <= monthSetting.lastMonthLastWeekDays + monthSetting.days + monthSetting.nextMonthFirstWeekDays; row += 1) {
      dayOffTable[colLength - 1][row] = 0;
    }

    employees.forEach(emp => {
      dayOffTable[emp.index][0] = emp.name;
      emp.planDayOffDates.forEach(date => {
        this._setEmpoyeeShift(dayOffTable, emp.index, date, ShiftType.DayOff);
      });
    });

    return dayOffTable;
  }

  _dateToRowIndex(date) {
    return date + this.monthSetting.lastMonthLastWeekDays;
  }

  start() {
    this._preAddDayOff(this.dayOffTable, this.monthSetting, this.employees);
    this._planAllDayOff(this.dayOffTable, this.monthSetting, this.employees);
  }

  _preAddDayOff(dayOffTable, monthSetting, employees) {
    let beginDateOfWeekOfMonth = monthSetting.beginDay === 1 ? 1 : 1 + (7 - monthSetting.beginDay + 1);
    for (let beginDateOfWeek = beginDateOfWeekOfMonth; beginDateOfWeek <= monthSetting.days + monthSetting.nextMonthFirstWeekDays; beginDateOfWeek += 7) {
      employees.forEach(emp => {
        let count = 0;
        for (let day = 0; day < 3; day++) {
          if (dayOffTable[emp.index][this._dateToRowIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count++;
        }
        if (count >= 2 && beginDateOfWeek + 7 <= 1 + monthSetting.lastMonthLastWeekDays + monthSetting.days + monthSetting.nextMonthFirstWeekDays) this._setEmpoyeeShift(dayOffTable, emp.index, beginDateOfWeek + 7, ShiftType.DayOff);
        count = 0;
        for (let day = 4; day < 7; day++) {
          if (dayOffTable[emp.index][this._dateToRowIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count++;
        }
        if (count >= 2 && beginDateOfWeek - 1 > 0) this._setEmpoyeeShift(dayOffTable, emp.index, beginDateOfWeek - 1, ShiftType.DayOff);
      });
    }
  }

  _planAllDayOff(dayOffTable, monthSetting, employees) {
    const planJobQueue = [];
    let firstDateOfThisWeek = monthSetting.beginDay === 1 ? 1 : 1 + (7 - monthSetting.beginDay + 1);
    for (; firstDateOfThisWeek <= monthSetting.days + monthSetting.nextMonthFirstWeekDays; firstDateOfThisWeek += 7) {
      const ftEmpNeedToPlan = employees
        .filter(emp => emp.role === Role.FT &&
          !this._isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, emp.index, firstDateOfThisWeek));

      this._populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfThisWeek, ftEmpNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthSetting, planJobQueue.pop());
      }

      const ptEmpNeedToPlan = employees
        .filter(emp => emp.role === Role.PT &&
          !this._isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, emp.index, firstDateOfThisWeek));

      this._populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfThisWeek, ptEmpNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthSetting, planJobQueue.pop());
      }

      this._processPlanJob(dayOffTable, monthSetting, { empIndex: employees.find(emp => emp.role === Role.MG).index, firstDateOfThisWeek });
    }
  }

  _populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfThisWeek, empNeedToPlan) {
    empNeedToPlan
      .filter(emp =>
        this._isNextWeekDayOffCountGreaterThan2(dayOffTable, emp.index, firstDateOfThisWeek) &&
        this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 1).forEach(emp => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter(emp =>
        this._isNextWeekDayOffCountGreaterThan2(dayOffTable, emp.index, firstDateOfThisWeek) &&
        this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 0).forEach(emp => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter(emp =>
        !this._isNextWeekDayOffCountGreaterThan2(dayOffTable, emp.index, firstDateOfThisWeek) &&
        this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 1).forEach(emp => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter(emp =>
        !this._isNextWeekDayOffCountGreaterThan2(dayOffTable, emp.index, firstDateOfThisWeek) &&
        this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 0).forEach(emp => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
  }

  _isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7)).filter(shift => shift === ShiftType.DayOff).length >= 2;
  }

  _processPlanJob(dayOffTable, monthSetting, planJob) {
    if (planJob.empIndex === 0) {
      for (let date = planJob.firstDateOfThisWeek; date < planJob.firstDateOfThisWeek + 7; date += 1) {
        if (dayOffTable[this.colLength - 1][this._dateToRowIndex(date)] < 2) {
          this._setEmpoyeeShift(dayOffTable, planJob.empIndex, date, ShiftType.DayOff);
        }
      }
    } else {
      this._planEmpDayOff(dayOffTable, monthSetting, planJob.empIndex, planJob.firstDateOfThisWeek);
    }
  }

  _planEmpDayOff(dayOffTable, monthSetting, empIndex, firstDateOfThisWeek) {
    let weekShifts = this._getThisWeekShifts(empIndex, firstDateOfThisWeek);
    const dayOffCount = weekShifts.filter(shift => shift === ShiftType.DayOff).length;
    if (dayOffCount === 1) {
      this._signTheOtherDayOffThisWeekForCaseIfThisWeekIsSignOneDayOffAlready(dayOffTable, firstDateOfThisWeek, weekShifts, empIndex);
    } else if (dayOffCount === 0) {
      const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(dayOffTable, empIndex, firstDateOfThisWeek);
      let candidateDates = [];
      let secCandidateDates = [];
      if (monthSetting.getDay(lastWeekLastDayOffDate) === Day[7]) {
        candidateDates = [firstDateOfThisWeek + 2, firstDateOfThisWeek + 3, firstDateOfThisWeek + 4];
        secCandidateDates = [firstDateOfThisWeek];
      } else if (monthSetting.getDay(lastWeekLastDayOffDate) === Day[6]) {
        candidateDates = [firstDateOfThisWeek + 1, firstDateOfThisWeek + 2, firstDateOfThisWeek + 3];
      } else if (monthSetting.getDay(lastWeekLastDayOffDate) === Day[5]) {
        candidateDates = [firstDateOfThisWeek, firstDateOfThisWeek + 1, firstDateOfThisWeek + 2];
      } else {
        candidateDates = [firstDateOfThisWeek, firstDateOfThisWeek + 1];
      }
      const dayOffDate = this._getLeastDayOffCountDate(dayOffTable, candidateDates);
      this._setEmpoyeeShift(dayOffTable, empIndex, dayOffDate, ShiftType.DayOff);

      this._signTheOtherDayOffThisWeekForCaseIfThisWeekIsSignOneDayOffAlready(dayOffTable, firstDateOfThisWeek, this._getThisWeekShifts(empIndex, firstDateOfThisWeek), empIndex);
    }
  }

  _getThisWeekShifts(empIndex, firstDateOfThisWeek) {
    return this.dayOffTable[empIndex].slice(this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7));
  }

  _signTheOtherDayOffThisWeekForCaseIfThisWeekIsSignOneDayOffAlready(dayOffTable, firstDateOfThisWeek, weekShifts, empIndex) {
    const thisWeekDayOffDate = firstDateOfThisWeek + weekShifts.indexOf(ShiftType.DayOff);
    const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(dayOffTable, empIndex, firstDateOfThisWeek);
    const beforeSeq = thisWeekDayOffDate - lastWeekLastDayOffDate - 1;
    const nextWeekFirstDayOff = this._getNextWeekFirstDayOffDate(dayOffTable, empIndex, firstDateOfThisWeek);
    let dayOffDate;
    if (this._isNextWeekDayOffCountGreaterThan2(dayOffTable, empIndex, firstDateOfThisWeek)) {
      const afterSeq = nextWeekFirstDayOff - lastWeekLastDayOffDate - 1;
      if (beforeSeq >= afterSeq) {
        if (beforeSeq <= MaxShiftSeq) dayOffDate = thisWeekDayOffDate - 1;
        else if (beforeSeq % 2 === 0) {
          dayOffDate = this._getLeastDayOffCountDate(dayOffTable, [thisWeekDayOffDate - (beforeSeq / 2), thisWeekDayOffDate - (beforeSeq / 2 + 1)], [thisWeekDayOffDate - 1]);
        } else {
          dayOffDate = thisWeekDayOffDate - (beforeSeq / 2 + beforeSeq % 2);
        }
      } else {
        if (afterSeq <= MaxShiftSeq) dayOffDate = thisWeekDayOffDate + 1;
        else if (afterSeq % 2 === 0) {
          dayOffDate = this._getLeastDayOffCountDate(dayOffTable, [thisWeekDayOffDate + (afterSeq / 2), thisWeekDayOffDate + (afterSeq / 2 + 1)], [thisWeekDayOffDate + 1]);
        } else {
          dayOffDate = thisWeekDayOffDate + (afterSeq / 2 + afterSeq % 2);
        }
      }
    } else {
      const thisWeakDayOffDay = this.monthSetting.getDay(thisWeekDayOffDate);
      let candidateDates = [];
      let secCandidateDates = [];
      if (thisWeakDayOffDay === Day[1]) {
        candidateDates = [thisWeekDayOffDate + 3, thisWeekDayOffDate + 4];
        if (nextWeekFirstDayOff === undefined || this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[1]) {
          candidateDates.push(thisWeekDayOffDate + 5);
        }
        if (nextWeekFirstDayOff === undefined || this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[2]) {
          secCandidateDates = [thisWeekDayOffDate + 6];
        }
        secCandidateDates.push(thisWeekDayOffDate + 1);
      } else if (thisWeakDayOffDay === Day[2]) {
        if (beforeSeq > MaxShiftSeq) {
          candidateDates = [thisWeekDayOffDate - 1];
        } else {
          candidateDates = [thisWeekDayOffDate + 3];
          if (nextWeekFirstDayOff === undefined) {
            candidateDates.push(thisWeekDayOffDate + 4, thisWeekDayOffDate + 5);
          } else {
            if (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[1]) candidateDates.push(thisWeekDayOffDate + 4);
            if (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[2]) candidateDates.push(thisWeekDayOffDate + 5);
          }
          secCandidateDates = [thisWeekDayOffDate + 1];
        }
      } else if (thisWeakDayOffDay === Day[3]) {
        if (beforeSeq > MaxShiftSeq) {
          candidateDates = [thisWeekDayOffDate - 1];
        } else {
          if (nextWeekFirstDayOff === undefined) {
            candidateDates.push(thisWeekDayOffDate + 3, thisWeekDayOffDate + 4);
          } else {
            if (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[1]) candidateDates.push(thisWeekDayOffDate + 3);
            if (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[2]) candidateDates.push(thisWeekDayOffDate + 4);
          }
          secCandidateDates = [thisWeekDayOffDate + 1];
        }
      } else if (thisWeakDayOffDay === Day[4]) {
        if (beforeSeq > MaxShiftSeq) {
          candidateDates = [thisWeekDayOffDate - 3];
        } else {
          if (nextWeekFirstDayOff === undefined ||
            (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[1] && this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[2])) {
            candidateDates = [thisWeekDayOffDate + 3];
            secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
          } else {
            candidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
          }
        }
      } else if (thisWeakDayOffDay === Day[5]) {
        const lastWeekLastDayOffDay = this.monthSetting.getDay(lastWeekLastDayOffDate);
        if (lastWeekLastDayOffDay === Day[7]) {
          candidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate - 4];
        } else if (lastWeekLastDayOffDay === Day[6]) {
          candidateDates = [thisWeekDayOffDate - 3];
          secCandidateDates = [thisWeekDayOffDate - 1];
        } else if (lastWeekLastDayOffDay === Day[5]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4];
        } else {
          candidateDates = [thisWeekDayOffDate - 4];
          secCandidateDates = [thisWeekDayOffDate - 3];
        }
      } else if (thisWeakDayOffDay === Day[6]) {
        const lastWeekLastDayOffDay = this.monthSetting.getDay(lastWeekLastDayOffDate);
        if (lastWeekLastDayOffDay === Day[7]) {
          candidateDates = [thisWeekDayOffDate - 3];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate - 5];
        } else if (lastWeekLastDayOffDay === Day[6]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4];
        } else {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4, , thisWeekDayOffDate - 5];
        }
      } else {
        const lastWeekLastDayOffDay = this.monthSetting.getDay(lastWeekLastDayOffDate);
        if (lastWeekLastDayOffDay === Day[7]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate - 6];
        } else if (lastWeekLastDayOffDay === Day[6]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4, thisWeekDayOffDate - 5];
        } else if (lastWeekLastDayOffDay === Day[5]) {
          candidateDates = [thisWeekDayOffDate - 4, , thisWeekDayOffDate - 5];
          secCandidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 6];
        } else {
          candidateDates = [thisWeekDayOffDate - 5];
          secCandidateDates = [thisWeekDayOffDate - 4, thisWeekDayOffDate - 6];
        }
      }
      dayOffDate = this._getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates);
      console.assert(dayOffTable[this.colLength - 1][this._dateToRowIndex(dayOffDate)] <= 1);
    }
    this._setEmpoyeeShift(dayOffTable, empIndex, dayOffDate, ShiftType.DayOff);
  }

  _getThisWeekDayOffCount(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7))
      .filter(shift => shift === ShiftType.DayOff).length;
  }

  _isNextWeekDayOffCountGreaterThan2(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(firstDateOfThisWeek + 7, firstDateOfThisWeek + 14)
      .filter(shift => shift === ShiftType.DayOff).length >= 2;
  }

  _getNextWeekFirstDayOffDate(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(this._dateToRowIndex(firstDateOfThisWeek + 7), this._dateToRowIndex(firstDateOfThisWeek + 14))
      .find(shift => shift === ShiftType.DayOff);
  }

  _getLastWeekLastDayOffDate(dayOffTable, empIndex, firstDateOfThisWeek) {
    return firstDateOfThisWeek - 1 - dayOffTable[empIndex].slice(this._dateToRowIndex(firstDateOfThisWeek - 7), this._dateToRowIndex(firstDateOfThisWeek))
      .reverse().indexOf(ShiftType.DayOff);
  }

  _setEmpoyeeShift(dayOffTable, empIndex, date, shiftType) {
    const row = this._dateToRowIndex(date);
    if (dayOffTable[empIndex][row] === shiftType) return;

    if (dayOffTable[empIndex][row] !== ShiftType.DayOff && shiftType === ShiftType.DayOff) {
      dayOffTable[this.colLength - 1][row] += 1;
    } else if (dayOffTable[empIndex][row] === ShiftType.DayOff && shiftType !== ShiftType.DayOff) {
      dayOffTable[this.colLength - 1][row] -= 1;
    }
    console.assert(dayOffTable[this.colLength - 1][row] <= 2);
    dayOffTable[empIndex][row] = shiftType;
  }

  _getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates) {
    if (candidateDates &&
      candidateDates.length === 1 &&
      dayOffTable[this.colLength - 1][this._dateToRowIndex(candidateDates[0]) < 2]) return candidateDates[0];

    let minCount = Number.MAX_VALUE;
    let result = [];
    candidateDates.forEach(date => {
      if (dayOffTable[this.colLength - 1][this._dateToRowIndex(date)] < minCount) {
        result = [date];
        minCount = dayOffTable[this.colLength - 1][this._dateToRowIndex(date)];
      } else if (dayOffTable[this.colLength - 1][this._dateToRowIndex(date)] === minCount) {
        result.push(date);
      }
    });

    if (minCount >= 2) {
      secCandidateDates.forEach(date => {
        if (dayOffTable[this.colLength - 1][this._dateToRowIndex(date)] < minCount) {
          result = [date];
          minCount = dayOffTable[this.colLength - 1][this._dateToRowIndex(date)];
        } else if (dayOffTable[this.colLength - 1][this._dateToRowIndex(date)] === minCount) {
          result.push(date);
        }
      });
    }
    console.assert(minCount <= 2);
    return result[Math.floor(Math.random() * result.length)];
  }

  printRoster(headerName, footerName) {
    const docFrag = new DocumentFragment();
    this._populateRosterTableHeader(docFrag, this.monthSetting, this.rowLength, headerName);
    this._populateRosterTableBody(docFrag, this.dayOffTable);
    this._populateRosterTableFoot(docFrag, this.rowLength, footerName);
    document.querySelector("#roster").appendChild(docFrag);
  }

  _populateRosterTableHeader(docFrag, monthSetting, rowLength, headerName) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = headerName;
    td.colSpan = rowLength;
    tr.appendChild(td);
    thead.appendChild(tr);
    this._populateRosterTableHeaderDate(thead, monthSetting);
    this._populateRosterTableHeaderDay(thead, monthSetting);
    docFrag.appendChild(thead, this.rowLength);
  }

  _populateRosterTableHeaderDate(thead, monthSetting) {
    const dateTr = document.createElement("tr");
    dateTr.appendChild(document.createElement("th"));
    for (let date = monthSetting.lastMonthDays - monthSetting.lastMonthLastWeekDays + 1; date <= monthSetting.lastMonthDays; date += 1) {
      const dateTh = document.createElement("th");
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    for (let date = 1; date <= monthSetting.days; date++) {
      const dateTh = document.createElement("th");
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    for (let date = 1; date <= monthSetting.nextMonthFirstWeekDays; date++) {
      const dateTh = document.createElement("th");
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    thead.appendChild(dateTr);
  }

  _populateRosterTableHeaderDay(thead, monthSetting) {
    const dayTr = document.createElement("tr");
    dayTr.appendChild(document.createElement("th"));
    for (let date = monthSetting.lastMonthDays - monthSetting.lastMonthLastWeekDays + 1; date <= monthSetting.lastMonthDays; date += 1) {
      const dayTh = document.createElement("th");
      dayTh.innerText = monthSetting.getDay(date - monthSetting.lastMonthDays);
      dayTr.appendChild(dayTh);
    }
    for (let date = 1; date <= monthSetting.days; date++) {
      const dayTh = document.createElement("th");
      dayTh.innerText = monthSetting.getDay(date);
      dayTr.appendChild(dayTh);
    }
    for (let date = 1; date <= monthSetting.nextMonthFirstWeekDays; date++) {
      const dayTh = document.createElement("th");
      dayTh.innerText = monthSetting.getDay(monthSetting.days + date);
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
    tableRows.forEach((row, colIndex) => {
      const tr = document.createElement("tr");
      row.forEach((cell, rowIndex) => {
        const td = document.createElement("td");
        if (rowIndex !== 0 && rowIndex < this.rowLength - Object.keys(ShiftType).length - 1 && colIndex === this.colLength - 1 && cell !== 2) td.className = 'error';
        if (rowIndex > 0 && colIndex < this.colLength - 1 && this.origDayOffTable[colIndex][rowIndex] === ShiftType.DayOff) td.className = 'orig-day-off';
        td.innerText = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    docFrag.appendChild(tbody);
  }

  _populateRosterTableFoot(docFrag, rowLength, footerName) {
    const tfoot = document.createElement('tfoot');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = footerName;
    td.colSpan = rowLength;
    tr.appendChild(td);
    tfoot.appendChild(tr);
    docFrag.appendChild(tfoot);
  }
}

class MonthSetting {
  constructor({ beginDay, thisMonthdays, lastMonthDays, holidayOffDates }) {
    this.beginDay = beginDay;
    this.days = thisMonthdays;
    this.lastMonthDays = lastMonthDays;
    this.holidayOffDates = holidayOffDates;
    this.nextMonthFirstWeekDays = this.getNextMonthFirstWeekDays();
    this.lastMonthLastWeekDays = this.getLastMonthLastWeekDays();
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

  getNextMonthFirstWeekDays() {
    return 7 - (this.beginDay + this.days - 1) % 7;
  }

  getLastMonthLastWeekDays() {
    return this.beginDay - 1;
  }
}

class Employee {
  constructor({ index, name, planDayOffDates, role, maxShiftSeq = MaxShiftSeq }) {
    this.index = index;
    this.name = name;
    this.planDayOffDates = planDayOffDates;
    this.role = role;
    this.maxSeqShift = maxShiftSeq;
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
