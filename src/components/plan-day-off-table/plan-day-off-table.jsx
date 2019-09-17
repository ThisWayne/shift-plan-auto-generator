import React, { PureComponent } from 'react';
import DateRow from './date-row';
import DayRow from './day-row';
import './plan-day-off-table.scss';

export default class PlanDayOffTable extends PureComponent {
  render() {
    const {
      monthData, employeeModels, dayOffTable, dayOffTableCellClick,
    } = this.props;
    if (!monthData) return null;
    const rowLength = 1 + monthData.lastMonthLastWeekDays + monthData.days
      + monthData.nextMonthFirstWeekDays + 1; // first +1 for name column, last +1 for role column
    const thisMonthText = monthData.dateObj.toLocaleString('default', { month: 'long' });
    const thisMonth = new Date(monthData.dateObj);
    thisMonth.setMonth(monthData.dateObj.getMonth() - 1);
    const lastMonthText = thisMonth.toLocaleString('default', { month: 'long' });

    const bodyRows = employeeModels.map((emp, rowIndex) => {
      const emptyCells = [];
      for (let col = 1; col <= rowLength - 2; col += 1) {
        emptyCells.push(
          <td key={col} className="buttonCell">
            <button type="button" onClick={() => { dayOffTableCellClick(rowIndex, col); }}>
              {dayOffTable[rowIndex][col]}
            </button>
          </td>,
        );
      }
      return (
        <tr key={emp.uniqueId}>
          <td key="name">{emp.name}</td>
          {emptyCells}
          <td key="role">
            {emp.role}
          </td>
        </tr>
      );
    });
    return (
      <table className="roster-table">
        <thead>
          <tr>
            <th colSpan={rowLength}>
              {`${thisMonthText}排休`}
            </th>
          </tr>
          <DateRow {...{ monthData }} />
          <DayRow {...{ monthData }} />
        </thead>
        <tbody>{bodyRows}</tbody>
        <tfoot>
          <tr><td colSpan={rowLength}>{`請填上${lastMonthText}最後一周的休假，以及${thisMonthText}的劃休`}</td></tr>
        </tfoot>
      </table>
    );
  }
}
