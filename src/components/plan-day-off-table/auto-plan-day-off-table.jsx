import React, { PureComponent } from 'react';
import DateRow from './date-row';
import DayRow from './day-row';
import './auto-plan-day-off-table.scss';

export default class AutoPlanDayOffTable extends PureComponent {
  render() {
    const {
      monthData, employeeModels, autoDayOffTable,
    } = this.props;
    if (!autoDayOffTable) return null;
    const rowLength = 1 + monthData.lastMonthLastWeekDays + monthData.days
      + monthData.nextMonthFirstWeekDays + 1; // first +1 for name column, last +1 for role column
    const thisMonthText = monthData.dateObj.toLocaleString('default', { month: 'long' });
    const thisMonth = new Date(monthData.dateObj);
    thisMonth.setMonth(monthData.dateObj.getMonth() - 1);
    const lastMonthText = thisMonth.toLocaleString('default', { month: 'long' });

    const bodyRows = employeeModels.map((emp, rowIndex) => {
      const shiftCells = [];
      for (let col = 1; col <= rowLength - 2; col += 1) {
        shiftCells.push(
          <td key={col} className="table-data">
            {autoDayOffTable[rowIndex][col]}
          </td>,
        );
      }
      return (
        <tr key={emp.uniqueId}>
          <td key="name">{emp.name}</td>
          {shiftCells}
          <td key="role">
            {emp.role}
          </td>
        </tr>
      );
    });

    const countRow = [];
    countRow.push(<td key="pre padding" />);
    for (let col = 1; col <= rowLength - 2; col += 1) {
      countRow.push(
        <td key={col}>
          {autoDayOffTable[employeeModels.length][col]}
        </td>,
      );
    }
    bodyRows.push(
      <tr key={new Date().getTime()}>
        {countRow}
      </tr>,
    );
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
