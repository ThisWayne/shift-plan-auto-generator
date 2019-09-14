/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { PureComponent } from 'react';

export default class DateRow extends PureComponent {
  render() {
    const { monthData } = this.props;
    const dateHeaders = [];
    dateHeaders.push(<th key="pre padding" />);
    const firstDateOfTable = 1 + monthData.lastMonthDays - monthData.lastMonthLastWeekDays;
    for (let date = firstDateOfTable; date <= monthData.lastMonthDays; date += 1) {
      if (date === monthData.lastMonthDays) {
        dateHeaders.push(<th key={`last${date}`} className="endOfLastMonth">{date}</th>);
      } else {
        dateHeaders.push(<th key={`last${date}`}>{date}</th>);
      }
    }
    for (let date = 1; date <= monthData.days; date += 1) {
      if (date === monthData.days) {
        dateHeaders.push(<th key={`this${date}`} className="endOfThisMonth">{date}</th>);
      } else {
        dateHeaders.push(<th key={`this${date}`}>{date}</th>);
      }
    }
    for (let date = 1; date <= monthData.nextMonthFirstWeekDays; date += 1) {
      if (date === monthData.nextMonthFirstWeekDays) {
        dateHeaders.push(<th key={`next${date}`} className="endOfNextMonth">{date}</th>);
      } else {
        dateHeaders.push(<th key={`next${date}`}>{date}</th>);
      }
    }
    return (
      <tr className="date-row">
        {dateHeaders}
      </tr>
    );
  }
}
