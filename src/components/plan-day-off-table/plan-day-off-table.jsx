import React, { PureComponent } from 'react';
import DateRow from './date-row';
import DayRow from './day-row';

export default class PlanDayOffTable extends PureComponent {
  render() {
    const {
      monthData, rowLength, headerName, footerName,
    } = this.props;
    if (!monthData) return null;
    return (
      <table>
        <thead>
          <tr>
            <th colSpan={rowLength}>{headerName}</th>
          </tr>
          <DateRow {...{ monthData }} />
          <DayRow {...{ monthData }} />
        </thead>
        <tbody />
        <tfoot>
          <tr><td>{footerName}</td></tr>
        </tfoot>
      </table>
    );
  }
}
