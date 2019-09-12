/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { PureComponent } from 'react';

export default class DateRow extends PureComponent {
  render() {
    const { monthData } = this.props;
    const dateHeaders = [];
    dateHeaders.push(<th />);
    const firstDateOfTable = 1 + monthData.lastMonthDays - monthData.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthData.lastMonthDays; date += 1) {
      dateHeaders.push(<th>{date}</th>);
    }
    for (let date = 1; date <= monthData.days; date += 1) {
      dateHeaders.push(<th>{date}</th>);
    }
    for (let date = 1; date <= monthData.nextMonthFirstWeekDays; date += 1) {
      dateHeaders.push(<th>{date}</th>);
    }
    return (
      <tr>
        {dateHeaders}
      </tr>
    );
  }
}
