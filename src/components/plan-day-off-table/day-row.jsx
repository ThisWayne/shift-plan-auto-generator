/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { PureComponent } from 'react';

export default class DayRow extends PureComponent {
  render() {
    const { monthData } = this.props;
    const dayHeaders = [];
    dayHeaders.push(<th key="pre padding" />);
    const firstDateOfTable = 1 + monthData.lastMonthDays - monthData.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthData.lastMonthDays; date += 1) {
      const day = monthData.getDay(date - monthData.lastMonthDays);
      dayHeaders.push(<th key={`last${date} ${day}`} className="last-month">{day}</th>);
    }
    for (let date = 1; date <= monthData.days; date += 1) {
      const day = monthData.getDay(date);
      dayHeaders.push(<th key={`this${date} ${day}`} className="this-month">{day}</th>);
    }
    for (let date = 1; date <= monthData.nextMonthFirstWeekDays; date += 1) {
      const day = monthData.getDay(monthData.days + date);
      dayHeaders.push(<th key={`next${date} ${day}`} className="next-month">{day}</th>);
    }
    return (
      <tr className="day-row">
        {dayHeaders}
      </tr>
    );
  }
}
