import React from 'react';

export default function YearMonth(props) {
  const {
    yearOptions, selectedYear, selectedMonth, handleYearSelectChange, handleMonthSelectChange,
  } = props;

  const monthOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const yearSelectOptions = yearOptions.map(
    (year) => <option key={year} value={year}>{year}</option>,
  );
  const monthSelectOptions = monthOptions.map(
    (month) => <option key={month} value={month}>{month + 1}</option>,
  );

  return (
    <div>
      <h3>計畫排班月份</h3>
      <select value={selectedYear} onChange={handleYearSelectChange}>
        {yearSelectOptions}
      </select>
      <select value={selectedMonth} onChange={handleMonthSelectChange}>
        {monthSelectOptions}
      </select>
    </div>
  );
}
