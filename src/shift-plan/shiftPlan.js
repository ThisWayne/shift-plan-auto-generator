/* eslint-disable no-param-reassign */
import {
  Day, ShiftType, Role, MaxShiftSeq,
} from './constants';

export default class ShiftPlan {
  constructor(monthModel, origDayOffTable, autoDayOffTable) {
    Object.assign(this, { monthModel, origDayOffTable, autoDayOffTable });
    this.rows = autoDayOffTable.length;
    this.cols = autoDayOffTable[0].length;
  }

  _dateToColIndex(date) {
    return date + this.monthModel.lastMonthLastWeekDays;
  }

  getAutoDayOffTable() {
    this._preAddDayOff(this.autoDayOffTable, this.monthModel);
    this._planAllDayOff(this.autoDayOffTable, this.monthModel);
    return this.autoDayOffTable;
  }

  _preAddDayOff(dayOffTable, monthModel) {
    const beginDateOfWeekOfMonth = monthModel.beginDay === 1 ? 1 : 1 + (7 - monthModel.beginDay + 1);
    const endDateOfMonth = monthModel.days + monthModel.nextMonthFirstWeekDays;
    for (let beginDateOfWeek = beginDateOfWeekOfMonth; beginDateOfWeek <= endDateOfMonth; beginDateOfWeek += 7) {
      this._preAddDayOffForWeek(dayOffTable, monthModel, beginDateOfWeek);
    }
  }

  _preAddDayOffForWeek(dayOffTable, monthModel, beginDateOfWeek) {
    for (let rowIndex = 0; rowIndex < dayOffTable.length - 1; rowIndex += 1) {
      let count = 0;
      for (let day = 0; day < 3; day += 1) {
        if (dayOffTable[rowIndex][this._dateToColIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count += 1;
      }
      if (count >= 2
        && beginDateOfWeek + 7 <= 1 + monthModel.lastMonthLastWeekDays
        + monthModel.days + monthModel.nextMonthFirstWeekDays) {
        this._setTableCellShift(dayOffTable, rowIndex, beginDateOfWeek + 7, ShiftType.DayOff);
      }
      count = 0;
      for (let day = 4; day < 7; day += 1) {
        if (dayOffTable[rowIndex][this._dateToColIndex(beginDateOfWeek + day)] === ShiftType.DayOff) count += 1;
      }
      if (count >= 2 && beginDateOfWeek - 1 > 0) {
        this._setTableCellShift(dayOffTable, rowIndex, beginDateOfWeek - 1, ShiftType.DayOff);
      }
    }
  }

  _planAllDayOff(dayOffTable, monthModel) {
    const planJobQueue = [];
    const firstDateOfThisMonth = monthModel.beginDay === 1 ? 1 : 1 + (7 - monthModel.beginDay + 1);
    const endOfPlanDate = monthModel.days + monthModel.nextMonthFirstWeekDays;
    for (let firstDateOfWeek = firstDateOfThisMonth; firstDateOfWeek <= endOfPlanDate; firstDateOfWeek += 7) {
      const ftRowsNeedToPlan = dayOffTable
        .filter((row) => row[row.length - 1] === Role.FT
          && !this._isThisWeekDayOffCountGreaterEqualThan2(row, firstDateOfWeek));

      this._populatePlanJobQueue(planJobQueue, firstDateOfWeek, ftRowsNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthModel, planJobQueue.pop());
      }

      const ptRowsNeedToPlan = dayOffTable
        .filter((row) => row[row.length - 1] === Role.PT
          && !this._isThisWeekDayOffCountGreaterEqualThan2(row, firstDateOfWeek));

      this._populatePlanJobQueue(planJobQueue, firstDateOfWeek, ptRowsNeedToPlan);

      while (planJobQueue.length !== 0) {
        this._processPlanJob(dayOffTable, monthModel, planJobQueue.pop());
      }

      this._preAddDayOffForWeek(dayOffTable, monthModel, firstDateOfWeek);

      this._processPlanJob(
        dayOffTable, monthModel,
        {
          row: dayOffTable.find((row) => row[row.length - 1] === Role.MG),
          firstDateOfThisWeek: firstDateOfWeek,
        },
      );
    }
  }

  _populatePlanJobQueue(planJobQueue, firstDateOfThisWeek, rowsNeedToPlan) {
    rowsNeedToPlan
      .filter((row) => this._isNextWeekDayOffCountGreaterThan2(row, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(row, firstDateOfThisWeek) === 1).forEach((row) => {
          planJobQueue.unshift({ row, firstDateOfThisWeek });
        });
    rowsNeedToPlan
      .filter((row) => this._isNextWeekDayOffCountGreaterThan2(row, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(row, firstDateOfThisWeek) === 0).forEach((row) => {
          planJobQueue.unshift({ row, firstDateOfThisWeek });
        });
    rowsNeedToPlan
      .filter((row) => !this._isNextWeekDayOffCountGreaterThan2(row, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(row, firstDateOfThisWeek) === 1).forEach((row) => {
          planJobQueue.unshift({ row, firstDateOfThisWeek });
        });
    rowsNeedToPlan
      .filter((row) => !this._isNextWeekDayOffCountGreaterThan2(row, firstDateOfThisWeek)
        && this._getThisWeekDayOffCount(row, firstDateOfThisWeek) === 0).forEach((row) => {
          planJobQueue.unshift({ row, firstDateOfThisWeek });
        });
  }

  _isThisWeekDayOffCountGreaterEqualThan2(row, firstDateOfThisWeek) {
    return row.slice(
      this._dateToColIndex(firstDateOfThisWeek), this._dateToColIndex(firstDateOfThisWeek + 7),
    ).filter((shift) => shift === ShiftType.DayOff).length >= 2;
  }

  _processPlanJob(dayOffTable, monthModel, planJob) {
    if (planJob.row[this.cols - 1] === Role.MG) {
      for (let date = planJob.firstDateOfThisWeek; date < planJob.firstDateOfThisWeek + 7; date += 1) {
        if (dayOffTable[this.rows - 1][this._dateToColIndex(date)] < 2) {
          this._setTableCellShift(dayOffTable, planJob.row, date, ShiftType.DayOff);
        }
      }
    } else {
      this._planRowDayOff(dayOffTable, monthModel, planJob.row, planJob.firstDateOfThisWeek);
    }
  }

  _planRowDayOff(dayOffTable, monthModel, row, firstDateOfThisWeek) {
    const weekShifts = this._getThisWeekShifts(row, firstDateOfThisWeek);
    const dayOffCount = weekShifts.filter((shift) => shift === ShiftType.DayOff).length;
    if (dayOffCount === 1) {
      this._signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
        dayOffTable, firstDateOfThisWeek, weekShifts, row,
      );
    } else if (dayOffCount === 0) {
      const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(row, firstDateOfThisWeek);
      let candidateDates = [];
      let secCandidateDates = [];
      if (monthModel.getDay(lastWeekLastDayOffDate) === Day[7]) {
        candidateDates = [firstDateOfThisWeek + 2, firstDateOfThisWeek + 3, firstDateOfThisWeek + 4];
        secCandidateDates = [firstDateOfThisWeek];
      } else if (monthModel.getDay(lastWeekLastDayOffDate) === Day[6]) {
        candidateDates = [firstDateOfThisWeek + 1, firstDateOfThisWeek + 2, firstDateOfThisWeek + 3];
      } else if (monthModel.getDay(lastWeekLastDayOffDate) === Day[5]) {
        candidateDates = [firstDateOfThisWeek, firstDateOfThisWeek + 1, firstDateOfThisWeek + 2];
      } else {
        candidateDates = [firstDateOfThisWeek, firstDateOfThisWeek + 1];
      }
      const dayOffDate = this._getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates);
      this._setTableCellShift(dayOffTable, row, dayOffDate, ShiftType.DayOff);

      this._signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
        dayOffTable, firstDateOfThisWeek, this._getThisWeekShifts(row, firstDateOfThisWeek), row,
      );
    }
  }

  _getThisWeekShifts(row, firstDateOfThisWeek) {
    return row.slice(
      this._dateToColIndex(firstDateOfThisWeek), this._dateToColIndex(firstDateOfThisWeek + 7),
    );
  }

  _signTheOtherDayOffThisWeekWhenThisWeekIsSignOneDayOffAlready(
    dayOffTable, firstDateOfThisWeek, weekShifts, row,
  ) {
    const thisWeekDayOffDate = firstDateOfThisWeek + weekShifts.indexOf(ShiftType.DayOff);
    const lastWeekLastDayOffDate = this._getLastWeekLastDayOffDate(row, firstDateOfThisWeek);
    const beforeSeq = thisWeekDayOffDate - lastWeekLastDayOffDate - 1;
    const nextWeekFirstDayOff = this._getNextWeekFirstDayOffDate(row, firstDateOfThisWeek);
    let dayOffDate;
    if (this._isNextWeekDayOffCountGreaterThan2(row, firstDateOfThisWeek)) {
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
      const thisWeakDayOffDay = this.monthModel.getDay(thisWeekDayOffDate);
      let candidateDates = [];
      let secCandidateDates = [];
      if (thisWeakDayOffDay === Day[1]) {
        candidateDates = [thisWeekDayOffDate + 3, thisWeekDayOffDate + 4];
        if (nextWeekFirstDayOff === undefined || this.monthModel.getDay(nextWeekFirstDayOff) !== Day[1]) {
          candidateDates.push(thisWeekDayOffDate + 5);
        }
        if (nextWeekFirstDayOff === undefined || this.monthModel.getDay(nextWeekFirstDayOff) !== Day[2]) {
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
            if (this.monthModel.getDay(nextWeekFirstDayOff) !== Day[1]) candidateDates.push(thisWeekDayOffDate + 4);
            if (this.monthModel.getDay(nextWeekFirstDayOff) !== Day[2]) candidateDates.push(thisWeekDayOffDate + 5);
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
            if (this.monthModel.getDay(nextWeekFirstDayOff) !== Day[1]) candidateDates.push(thisWeekDayOffDate + 3);
            if (this.monthModel.getDay(nextWeekFirstDayOff) !== Day[2]) candidateDates.push(thisWeekDayOffDate + 4);
          }
          secCandidateDates = [thisWeekDayOffDate + 1];
        }
      } else if (thisWeakDayOffDay === Day[4]) {
        if (beforeSeq > MaxShiftSeq) {
          candidateDates = [thisWeekDayOffDate - 3];
        } else if (nextWeekFirstDayOff === undefined
          || (this.monthModel.getDay(nextWeekFirstDayOff) !== Day[1]
            && this.monthModel.getDay(nextWeekFirstDayOff) !== Day[2])) {
          candidateDates = [thisWeekDayOffDate + 3];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
        } else {
          candidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate + 1];
        }
      } else if (thisWeakDayOffDay === Day[5]) {
        const lastWeekLastDayOffDay = this.monthModel.getDay(lastWeekLastDayOffDate);
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
        const lastWeekLastDayOffDay = this.monthModel.getDay(lastWeekLastDayOffDate);
        if (lastWeekLastDayOffDay === Day[7]) {
          candidateDates = [thisWeekDayOffDate - 3];
          secCandidateDates = [thisWeekDayOffDate - 1, thisWeekDayOffDate - 5];
        } else if (lastWeekLastDayOffDay === Day[6]) {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4];
        } else {
          candidateDates = [thisWeekDayOffDate - 3, thisWeekDayOffDate - 4, thisWeekDayOffDate - 5];
        }
      } else {
        const lastWeekLastDayOffDay = this.monthModel.getDay(lastWeekLastDayOffDate);
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
      console.assert(dayOffTable[this.rows - 1][this._dateToColIndex(dayOffDate)] <= 1);
    }
    this._setTableCellShift(dayOffTable, row, dayOffDate, ShiftType.DayOff);
  }

  _getThisWeekDayOffCount(row, firstDateOfThisWeek) {
    return row.slice(
      this._dateToColIndex(firstDateOfThisWeek), this._dateToColIndex(firstDateOfThisWeek + 7),
    ).filter((shift) => shift === ShiftType.DayOff).length;
  }

  _isNextWeekDayOffCountGreaterThan2 = (row, firstDateOfThisWeek) => row.slice(
    firstDateOfThisWeek + 7, firstDateOfThisWeek + 14,
  ).filter(
    (shift) => shift === ShiftType.DayOff,
  ).length >= 2

  _getNextWeekFirstDayOffDate(row, firstDateOfThisWeek) {
    return row.slice(
      this._dateToColIndex(firstDateOfThisWeek + 7), this._dateToColIndex(firstDateOfThisWeek + 14),
    ).find((shift) => shift === ShiftType.DayOff);
  }

  _getLastWeekLastDayOffDate(row, firstDateOfThisWeek) {
    return firstDateOfThisWeek - 1
      - row.slice(
        this._dateToColIndex(firstDateOfThisWeek - 7), this._dateToColIndex(firstDateOfThisWeek),
      ).reverse().indexOf(ShiftType.DayOff);
  }

  _setTableCellShift(dayOffTable, row, date, shiftType) {
    const colIndex = this._dateToColIndex(date);
    if (row[colIndex] === shiftType) return;

    if (row[colIndex] !== ShiftType.DayOff && shiftType === ShiftType.DayOff) {
      dayOffTable[this.rows - 1][colIndex] += 1;
    } else if (row[colIndex] === ShiftType.DayOff && shiftType !== ShiftType.DayOff) {
      dayOffTable[this.rows - 1][colIndex] -= 1;
    }
    row[colIndex] = shiftType;
  }

  _getLeastDayOffCountDate(dayOffTable, candidateDates, secCandidateDates) {
    if (candidateDates
      && candidateDates.length === 1
      && dayOffTable[this.rows - 1][this._dateToColIndex(candidateDates[0]) < 2]) return candidateDates[0];

    let minCount = Number.MAX_VALUE;
    let result = [];
    candidateDates.forEach((date) => {
      if (dayOffTable[this.rows - 1][this._dateToColIndex(date)] < minCount) {
        result = [date];
        minCount = dayOffTable[this.rows - 1][this._dateToColIndex(date)];
      } else if (dayOffTable[this.rows - 1][this._dateToColIndex(date)] === minCount) {
        result.push(date);
      }
    });

    if (minCount >= 2) {
      secCandidateDates.forEach((date) => {
        if (dayOffTable[this.rows - 1][this._dateToColIndex(date)] < minCount) {
          result = [date];
          minCount = dayOffTable[this.rows - 1][this._dateToColIndex(date)];
        } else if (dayOffTable[this.rows - 1][this._dateToColIndex(date)] === minCount) {
          result.push(date);
        }
      });
    }
    console.assert(minCount <= 2);
    return result[Math.floor(Math.random() * result.length)];
  }
}
