/* eslint-disable no-param-reassign */
import {
  Day, ShiftType, Role, MaxShiftSeq,
} from './constants';

export default class ShiftPlan {
  constructor(monthSetting, employeeModels) {
    Object.assign(this, { monthSetting, employeeModels });
    this.cols = 1 + monthSetting.lastMonthLastWeekDays + monthSetting.days
      + monthSetting.nextMonthFirstWeekDays + Object.keys(ShiftType).length + 1;
    this.rows = employeeModels.length + 1;
    this.dayOffCells = [];
    this.origDayOffTable = this._initialDayOffTable();
  }

  _initialDayOffTable() {
    const {
      monthSetting, cols, rows, employeeModels, dayOffCells,
    } = this;
    const dayOffTable = Array.from(
      Array(rows),
      () => Array(cols).fill(''),
    );

    const daysCols = monthSetting.lastMonthLastWeekDays + monthSetting.days + monthSetting.nextMonthFirstWeekDays;
    for (let col = 1; col <= daysCols; col += 1) {
      dayOffTable[rows - 1][col] = 0;
    }

    employeeModels.forEach((emp) => {
      dayOffTable[emp.index][0] = emp.name;
    });

    dayOffCells.forEach((dayOffCell) => {
      dayOffTable[dayOffCell.rowIndex][dayOffCell.colIndex] = ShiftType.DayOff;
    });

    return dayOffTable;
  }

  addEmployeeModel(employeeModel) {
    const {
      origDayOffTable, cols, employeeModels,
    } = this;
    employeeModels.push(employeeModel);
    this._refreshEmployModelsIndex();
    if (this.origDayOffTable.length === 1) {
      this.origDayOffTable = this._initialDayOffTable();
    } else {
      this.origDayOffTable = [
        ...origDayOffTable.slice(0, origDayOffTable.length - 1),
        Array(cols).fill(''),
        ...origDayOffTable.slice(origDayOffTable.length - 1),
      ];
      origDayOffTable[this.origDayOffTable.length - 2][0] = employeeModel.name;
    }
  }

  editEmployeeModel(employeeModel) {
    const editedEmp = this.employeeModels.find((emp) => emp.uniqueId === employeeModel.uniqueId);
    editedEmp.name = employeeModel.name;
    this._refreshEmployModelsIndex();
    this.origDayOffTable[editedEmp.index][0] = employeeModel.name;
  }

  deleteEmployeeModel(employeeModelUniqueId) {
    const empIndex = this.employeeModels.find((emp) => emp.uniqueId === employeeModelUniqueId).index;
    this.employeeModels = this.employeeModels.filter((emp) => emp.uniqueId !== employeeModelUniqueId);
    this.origDayOffTable = this.origDayOffTable.filter((row, index) => index !== empIndex);
    this._refreshEmployModelsIndex();
  }

  flipDayOffCell(dayOffCell) {
    const { rowIndex, colIndex } = dayOffCell;
    if (this.origDayOffTable[rowIndex][colIndex] === ShiftType.DayOff) {
      this.origDayOffTable[rowIndex][colIndex] = '';
      this.dayOffCells = this.dayOffCells.filter((cell) => cell.rowIndex !== rowIndex && cell.colIndex !== colIndex);
    } else {
      this.origDayOffTable[rowIndex][colIndex] = ShiftType.DayOff;
      this.dayOffCells.push(dayOffCell);
    }
  }

  removeDayOffCell(dayOffCell) {
    this.dayOffCell = this.dayOffCell.filter(
      (cell) => cell.rowIndex === dayOffCell.rowIndex && cell.colIndex === dayOffCell.colIndex,
    );
  }

  _refreshEmployModelsIndex() {
    this.employeeModels = this.employeeModels.map((emp, index) => ({ ...emp, index }));
    this.rows = this.employeeModels.length + 1;
  }

  _dateToRowIndex(date) {
    return date + this.monthSetting.lastMonthLastWeekDays;
  }

  start() {
    this.autoDayOffTable = this._initialDayOffTable();
    this._preAddDayOff(this.autoDayOffTable, this.monthSetting, this.employeeModels);
    this._planAllDayOff(this.autoDayOffTable, this.monthSetting, this.employeeModels);
  }

  _preAddDayOff(dayOffTable, monthSetting, employeeModels) {
    const beginDateOfWeekOfMonth = monthSetting.beginDay === 1 ? 1 : 1 + (7 - monthSetting.beginDay + 1);
    const endDateOfMonth = monthSetting.days + monthSetting.nextMonthFirstWeekDays;
    for (let beginDateOfWeek = beginDateOfWeekOfMonth; beginDateOfWeek <= endDateOfMonth; beginDateOfWeek += 7) {
      this._preAddDayOffForWeek(dayOffTable, monthSetting, employeeModels, beginDateOfWeek);
    }
  }

  _preAddDayOffForWeek(dayOffTable, monthSetting, employeeModels, beginDateOfWeek) {
    employeeModels.forEach((emp) => {
      let count = 0;
      for (let day = 0; day < 3; day += 1) {
        if (dayOffTable[emp.index][this._dateToRowIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count += 1;
      }
      if (count >= 2
        && beginDateOfWeek + 7 <= 1 + monthSetting.lastMonthLastWeekDays
        + monthSetting.days + monthSetting.nextMonthFirstWeekDays) {
        this._setEmpoyeeShift(dayOffTable, emp.index, beginDateOfWeek + 7, ShiftType.DayOff);
      }
      count = 0;
      for (let day = 4; day < 7; day += 1) {
        if (dayOffTable[emp.index][this._dateToRowIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count += 1;
      }
      if (count >= 2 && beginDateOfWeek - 1 > 0) {
        this._setEmpoyeeShift(dayOffTable, emp.index, beginDateOfWeek - 1, ShiftType.DayOff);
      }
    });
  }

  _planAllDayOff(dayOffTable, monthSetting, employeeModels) {
    const planJobQueue = [];
    const firstDateOfThisMonth = monthSetting.beginDay === 1 ? 1 : 1 + (7 - monthSetting.beginDay + 1);
    const endOfPlanDate = monthSetting.days + monthSetting.nextMonthFirstWeekDays;
    for (let firstDateOfWeek = firstDateOfThisMonth; firstDateOfWeek <= endOfPlanDate; firstDateOfWeek += 7) {
      const ftEmpNeedToPlan = employeeModels
        .filter((emp) => emp.role === Role.FT
          && !this._isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, emp.index, firstDateOfWeek));

      this._populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfWeek, ftEmpNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthSetting, planJobQueue.pop());
      }

      const ptEmpNeedToPlan = employeeModels
        .filter((emp) => emp.role === Role.PT
          && !this._isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, emp.index, firstDateOfWeek));

      this._populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfWeek, ptEmpNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthSetting, planJobQueue.pop());
      }

      this._preAddDayOffForWeek(dayOffTable, monthSetting, employeeModels, firstDateOfWeek);

      this._processPlanJob(
        dayOffTable, monthSetting,
        { empIndex: employeeModels.find((emp) => emp.role === Role.MG).index, firstDateOfThisWeek: firstDateOfWeek },
      );
    }
  }

  _populatePlanJobQueue(planJobQueue, dayOffTable, firstDateOfThisWeek, empNeedToPlan) {
    empNeedToPlan
      .filter((emp) => this._isNextWeekDayOffCountGreaterThan2(emp.index, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 1).forEach((emp) => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter((emp) => this._isNextWeekDayOffCountGreaterThan2(emp.index, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 0).forEach((emp) => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter((emp) => !this._isNextWeekDayOffCountGreaterThan2(emp.index, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 1).forEach((emp) => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
    empNeedToPlan
      .filter((emp) => !this._isNextWeekDayOffCountGreaterThan2(emp.index, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(dayOffTable, emp.index, firstDateOfThisWeek) === 0).forEach((emp) => {
          planJobQueue.unshift({ empIndex: emp.index, firstDateOfThisWeek });
        });
  }

  _isThisWeekDayOffCountGreaterEqualThan2(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(
      this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7),
    ).filter((shift) => shift === ShiftType.DayOff).length >= 2;
  }

  _processPlanJob(dayOffTable, monthSetting, planJob) {
    if (planJob.empIndex === 0) {
      for (let date = planJob.firstDateOfThisWeek; date < planJob.firstDateOfThisWeek + 7; date += 1) {
        if (dayOffTable[this.rows - 1][this._dateToRowIndex(date)] < 2) {
          this._setEmpoyeeShift(dayOffTable, planJob.empIndex, date, ShiftType.DayOff);
        }
      }
    } else {
      this._planEmpDayOff(dayOffTable, monthSetting, planJob.empIndex, planJob.firstDateOfThisWeek);
    }
  }

  _planEmpDayOff(dayOffTable, monthSetting, empIndex, firstDateOfThisWeek) {
    const weekShifts = this._getThisWeekShifts(empIndex, firstDateOfThisWeek);
    const dayOffCount = weekShifts.filter((shift) => shift === ShiftType.DayOff).length;
    if (dayOffCount === 1) {
      this._signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
        dayOffTable, firstDateOfThisWeek, weekShifts, empIndex,
      );
    } else if (dayOffCount === 0) {
      const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(empIndex, firstDateOfThisWeek);
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
      const dayOffDate = this._getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates);
      this._setEmpoyeeShift(dayOffTable, empIndex, dayOffDate, ShiftType.DayOff);

      this._signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
        dayOffTable, firstDateOfThisWeek, this._getThisWeekShifts(empIndex, firstDateOfThisWeek), empIndex,
      );
    }
  }

  _getThisWeekShifts(empIndex, firstDateOfThisWeek) {
    return this.autoDayOffTable[empIndex].slice(
      this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7),
    );
  }

  _signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
    dayOffTable, firstDateOfThisWeek, weekShifts, empIndex,
  ) {
    const thisWeekDayOffDate = firstDateOfThisWeek + weekShifts.indexOf(ShiftType.DayOff);
    const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(empIndex, firstDateOfThisWeek);
    const beforeSeq = thisWeekDayOffDate - lastWeekLastDayOffDate - 1;
    const nextWeekFirstDayOff = this._getNextWeekFirstDayOffDate(empIndex, firstDateOfThisWeek);
    let dayOffDate;
    if (this._isNextWeekDayOffCountGreaterThan2(empIndex, firstDateOfThisWeek)) {
      const afterSeq = nextWeekFirstDayOff - lastWeekLastDayOffDate - 1;
      if (beforeSeq >= afterSeq) {
        if (beforeSeq <= MaxShiftSeq) dayOffDate = thisWeekDayOffDate - 1;
        else if (beforeSeq % 2 === 0) {
          dayOffDate = this._getLeastDayOffCountDate(
            dayOffTable,
            [thisWeekDayOffDate - (beforeSeq / 2), thisWeekDayOffDate - (beforeSeq / 2 + 1)],
            [thisWeekDayOffDate - 1],
          );
        } else {
          dayOffDate = thisWeekDayOffDate - ((beforeSeq / 2) + (beforeSeq % 2));
        }
      } else if (afterSeq <= MaxShiftSeq) dayOffDate = thisWeekDayOffDate + 1;
      else if (afterSeq % 2 === 0) {
        dayOffDate = this._getLeastDayOffCountDate(
          dayOffTable,
          [thisWeekDayOffDate + (afterSeq / 2), thisWeekDayOffDate + (afterSeq / 2 + 1)],
          [thisWeekDayOffDate + 1],
        );
      } else {
        dayOffDate = thisWeekDayOffDate + ((afterSeq / 2) + (afterSeq % 2));
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
          if (beforeSeq !== 1) secCandidateDates.push(thisWeekDayOffDate - 1);
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
        } else if (nextWeekFirstDayOff === undefined
          || (this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[1]
            && this.monthSetting.getDay(nextWeekFirstDayOff) !== Day[2])) {
          candidateDates = [thisWeekDayOffDate + 3];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
        } else {
          candidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
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
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4, thisWeekDayOffDate - 5];
        }
      } else {
        const lastWeekLastDayOffDay = this.monthSetting.getDay(lastWeekLastDayOffDate);
        if (lastWeekLastDayOffDay === Day[7]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate - 6];
        } else if (lastWeekLastDayOffDay === Day[6]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4, thisWeekDayOffDate - 5];
        } else if (lastWeekLastDayOffDay === Day[5]) {
          candidateDates = [thisWeekDayOffDate - 4, thisWeekDayOffDate - 5];
          secCandidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 6];
        } else {
          candidateDates = [thisWeekDayOffDate - 5];
          secCandidateDates = [thisWeekDayOffDate - 4, thisWeekDayOffDate - 6];
        }
      }
      dayOffDate = this._getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates);
      console.assert(dayOffTable[this.rows - 1][this._dateToRowIndex(dayOffDate)] <= 1);
    }
    this._setEmpoyeeShift(dayOffTable, empIndex, dayOffDate, ShiftType.DayOff);
  }

  _getThisWeekDayOffCount(dayOffTable, empIndex, firstDateOfThisWeek) {
    return dayOffTable[empIndex].slice(
      this._dateToRowIndex(firstDateOfThisWeek), this._dateToRowIndex(firstDateOfThisWeek + 7),
    ).filter((shift) => shift === ShiftType.DayOff).length;
  }

  _isNextWeekDayOffCountGreaterThan2(empIndex, firstDateOfThisWeek) {
    return this.autoDayOffTable[empIndex].slice(
      firstDateOfThisWeek + 7, firstDateOfThisWeek + 14,
    ).filter((shift) => shift === ShiftType.DayOff).length >= 2;
  }

  _getNextWeekFirstDayOffDate(empIndex, firstDateOfThisWeek) {
    return this.autoDayOffTable[empIndex].slice(
      this._dateToRowIndex(firstDateOfThisWeek + 7), this._dateToRowIndex(firstDateOfThisWeek + 14),
    ).find((shift) => shift === ShiftType.DayOff);
  }

  _getLastWeekLastDayOffDate(empIndex, firstDateOfThisWeek) {
    return firstDateOfThisWeek - 1
      - this.autoDayOffTable[empIndex].slice(
        this._dateToRowIndex(firstDateOfThisWeek - 7), this._dateToRowIndex(firstDateOfThisWeek),
      ).reverse().indexOf(ShiftType.DayOff);
  }

  _setEmpoyeeShift(dayOffTable, empIndex, date, shiftType) {
    const row = this._dateToRowIndex(date);
    if (dayOffTable[empIndex][row] === shiftType) return;

    if (dayOffTable[empIndex][row] !== ShiftType.DayOff && shiftType === ShiftType.DayOff) {
      dayOffTable[this.rows - 1][row] += 1;
    } else if (dayOffTable[empIndex][row] === ShiftType.DayOff && shiftType !== ShiftType.DayOff) {
      dayOffTable[this.rows - 1][row] -= 1;
    }
    console.assert(dayOffTable[this.rows - 1][row] <= 2);
    dayOffTable[empIndex][row] = shiftType;
  }

  _getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates) {
    if (candidateDates
      && candidateDates.length === 1
      && dayOffTable[this.rows - 1][this._dateToRowIndex(candidateDates[0]) < 2]) return candidateDates[0];

    let minCount = Number.MAX_VALUE;
    let result = [];
    candidateDates.forEach((date) => {
      if (dayOffTable[this.rows - 1][this._dateToRowIndex(date)] < minCount) {
        result = [date];
        minCount = dayOffTable[this.rows - 1][this._dateToRowIndex(date)];
      } else if (dayOffTable[this.rows - 1][this._dateToRowIndex(date)] === minCount) {
        result.push(date);
      }
    });

    if (minCount >= 2) {
      secCandidateDates.forEach((date) => {
        if (dayOffTable[this.rows - 1][this._dateToRowIndex(date)] < minCount) {
          result = [date];
          minCount = dayOffTable[this.rows - 1][this._dateToRowIndex(date)];
        } else if (dayOffTable[this.rows - 1][this._dateToRowIndex(date)] === minCount) {
          result.push(date);
        }
      });
    }
    console.assert(minCount <= 2);
    return result[Math.floor(Math.random() * result.length)];
  }

  printRoster(headerName, footerName) {
    const docFrag = new DocumentFragment();
    this._populateRosterTableHeader(docFrag, this.monthSetting, this.cols, headerName);
    this._populateRosterTableBody(docFrag, this.dayOffTable);
    this._populateRosterTableFoot(docFrag, footerName);
    document.querySelector('#roster').appendChild(docFrag);
  }

  _populateRosterTableHeader(docFrag, monthData, cols, headerName) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = headerName;
    td.colSpan = cols;
    tr.appendChild(td);
    thead.appendChild(tr);
    this._populateRosterTableHeaderDate(thead);
    this._populateRosterTableHeaderDay(thead);
    docFrag.appendChild(thead, this.cols);
  }

  _populateRosterTableHeaderDate(thead) {
    const { monthSetting } = this;
    const dateTr = document.createElement('tr');
    dateTr.appendChild(document.createElement('th'));
    const firstDateOfTable = 1 + monthSetting.lastMonthDays - monthSetting.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthSetting.lastMonthDays; date += 1) {
      const dateTh = document.createElement('th');
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    for (let date = 1; date <= monthSetting.days; date += 1) {
      const dateTh = document.createElement('th');
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    for (let date = 1; date <= monthSetting.nextMonthFirstWeekDays; date += 1) {
      const dateTh = document.createElement('th');
      dateTh.innerText = date;
      dateTr.appendChild(dateTh);
    }
    thead.appendChild(dateTr);
  }

  _populateRosterTableHeaderDay(thead) {
    const { monthSetting } = this;
    const dayTr = document.createElement('tr');
    dayTr.appendChild(document.createElement('th'));
    const firstDateOfTable = 1 + monthSetting.lastMonthDays - monthSetting.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthSetting.lastMonthDays; date += 1) {
      const dayTh = document.createElement('th');
      dayTh.innerText = monthSetting.getDay(date - monthSetting.lastMonthDays);
      dayTr.appendChild(dayTh);
    }
    for (let date = 1; date <= monthSetting.days; date += 1) {
      const dayTh = document.createElement('th');
      dayTh.innerText = monthSetting.getDay(date);
      dayTr.appendChild(dayTh);
    }
    for (let date = 1; date <= monthSetting.nextMonthFirstWeekDays; date += 1) {
      const dayTh = document.createElement('th');
      dayTh.innerText = monthSetting.getDay(monthSetting.days + date);
      dayTr.appendChild(dayTh);
    }

    Object.values(ShiftType).forEach((shiftTypeVal) => {
      const th = document.createElement('th');
      th.innerText = shiftTypeVal;
      dayTr.appendChild(th);
    });

    const th = document.createElement('th');
    th.innerText = '職';
    dayTr.appendChild(th);
    thead.appendChild(dayTr);
  }

  _populateRosterTableBody(docFrag) {
    const { dayOffTable: tableRows } = this;
    const tbody = document.createElement('tbody');
    tableRows.forEach((row, colIndex) => {
      const tr = document.createElement('tr');
      row.forEach((cell, rowIndex) => {
        const td = document.createElement('td');
        if (rowIndex !== 0
          && rowIndex < this.cols - Object.keys(ShiftType).length - 1
          && colIndex === this.rows - 1 && cell !== 2) td.className = 'error';
        if (rowIndex > 0
          && colIndex < this.rows - 1
          && this.origDayOffTable[colIndex][rowIndex] === ShiftType.DayOff) td.className = 'orig-day-off';
        td.innerText = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    docFrag.appendChild(tbody);
  }

  _populateRosterTableFoot(docFrag, footerName) {
    const { cols } = this;
    const tfoot = document.createElement('tfoot');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.innerText = footerName;
    td.colSpan = cols;
    tr.appendChild(td);
    tfoot.appendChild(tr);
    docFrag.appendChild(tfoot);
  }
}
