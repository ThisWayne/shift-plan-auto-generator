/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { PureComponent } from 'react';

export default class DayRow extends PureComponent {
  render() {
    const { monthData } = this.props;
    const dayHeaders = [];
    dayHeaders.push(<th />);
    const firstDateOfTable = 1 + monthData.lastMonthDays - monthData.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthData.lastMonthDays; date += 1) {
      dayHeaders.push(<th>{monthData.getDay(date - monthData.lastMonthDays)}</th>);
    }
    for (let date = 1; date <= monthData.days; date += 1) {
      dayHeaders.push(<th>{monthData.getDay(date)}</th>);
    }
    for (let date = 1; date <= monthData.nextMonthFirstWeekDays; date += 1) {
      dayHeaders.push(<th>{monthData.getDay(monthData.days + date)}</th>);
    }
    return (
      <tr>
        {dayHeaders}
      </tr>
    );
  }
}
