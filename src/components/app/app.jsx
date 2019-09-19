import React from 'react';
import './app.scss';
import {
  EmployeeModel, Role, MonthModel, ShiftPlan, ShiftType,
} from '../../shift-plan/index';
import Employee from '../employee/employee';
import YearMonth from '../year-month/year-month';
import PlanDayOffTable from '../plan-day-off-table/plan-day-off-table';
import AutoPlanDayOffTable from '../plan-day-off-table/auto-plan-day-off-table';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const date = new Date();
    const nextMonth = (this.thisMonth + 1) % 12;
    const thisYear = date.getFullYear();
    const thisMonth = date.getMonth();
    const selectedYear = nextMonth === 0 ? thisYear + 1 : thisYear;
    const selectedMonth = (thisMonth + 1) % 12;
    const monthModel = new MonthModel({ year: selectedYear, month: selectedMonth });
    this.yearOptions = [thisYear, thisYear + 1];
    this.roleOptions = Object.values(Role);
    this.state = {
      selectedYear,
      selectedMonth,
      monthModel,
      employeeModels: [],
      employeeIndexCounter: 0,
      origDayOffTable: this.initialDayOffTable(monthModel, []),
      autoDayOffTable: null,
    };
  }

  initialDayOffTable = (monthModel, employeeModels, shouldShiftTypeAppend = false) => {
    const rows = employeeModels.length + 1;
    const cols = this.getDayOffTableCols(monthModel, shouldShiftTypeAppend);

    const dayOffTable = Array.from(
      Array(rows),
      () => Array(cols).fill(''),
    );

    const daysCols = monthModel.lastMonthLastWeekDays + monthModel.days + monthModel.nextMonthFirstWeekDays;
    for (let col = 1; col <= daysCols; col += 1) {
      dayOffTable[rows - 1][col] = 0;
    }

    employeeModels.forEach((emp) => {
      dayOffTable[emp.index][0] = emp.name;
      dayOffTable[emp.index][cols - 1] = emp.role;
    });

    return dayOffTable;
  }

  getDayOffTableCols = (monthModel, shouldShiftTypeAppend = false) => (
    1 + monthModel.lastMonthLastWeekDays
    + monthModel.days
    + monthModel.nextMonthFirstWeekDays + 1
    + (shouldShiftTypeAppend ? Object.keys(ShiftType).length : 0));

  addEmpToDayOffTable = (dayOffTable, employeeModel, monthModel, shouldShiftTypeAppend = false) => {
    const newDayOffTable = [
      ...dayOffTable.slice(0, dayOffTable.length - 1),
      Array(this.getDayOffTableCols(monthModel, shouldShiftTypeAppend)).fill(''),
      ...dayOffTable.slice(dayOffTable.length - 1),
    ];
    newDayOffTable[newDayOffTable.length - 2][0] = employeeModel.name;
    return newDayOffTable;
  }

  editEmpToDayOffTable = (dayOffTable, empIndex, employeeModel) => {
    const newDayOffTable = [...dayOffTable];
    newDayOffTable[empIndex][0] = employeeModel.name;
    newDayOffTable[empIndex][newDayOffTable[empIndex].length - 1] = employeeModel.role;
    return newDayOffTable;
  }

  deleteEmpToDayOffTable = (dayOffTable, empIndex) => dayOffTable.filter(
    (row, rowIndex) => rowIndex !== empIndex,
  );

  handleYearSelectChange = (e) => {
    const selectedYear = e.target.value;
    this.setState((state) => {
      const monthModel = new MonthModel({ year: selectedYear, month: state.selectedMonth });
      const origDayOffTable = this.initialDayOffTable(monthModel, state.employeeModels);
      return {
        selectedYear, monthModel, origDayOffTable, autoDayOffTable: null,
      };
    });
  }

  handleMonthSelectChange = (e) => {
    const selectedMonth = e.target.value;
    this.setState((state) => {
      const monthModel = new MonthModel({ year: state.selectedYear, month: selectedMonth });
      const origDayOffTable = this.initialDayOffTable(monthModel, state.employeeModels);
      return {
        selectedMonth, monthModel, origDayOffTable, autoDayOffTable: null,
      };
    });
  }

  handleAddEmployeeBtnClick = () => {
    this.setState((state) => {
      const {
        employeeIndexCounter,
        employeeModels,
        origDayOffTable,
        monthModel,
      } = state;

      const role = employeeModels.length === 0 ? Role.MG : Role.FT;
      const newEmp = new EmployeeModel({
        uniqueId: employeeIndexCounter,
        index: employeeModels.length,
        name: `姓名${employeeIndexCounter}`,
        role,
      });

      const newDayOffTable = this.addEmpToDayOffTable(origDayOffTable, newEmp, monthModel);

      return {
        employeeModels: [...employeeModels, newEmp],
        employeeIndexCounter: employeeIndexCounter + 1,
        origDayOffTable: newDayOffTable,
        autoDayOffTable: null,
      };
    });
  }

  handleEmployeeChange = (e) => {
    const { name, value } = e.target;
    const uniqueId = Number(e.target.dataset.uniqueId);
    this.setState((state) => {
      const {
        employeeModels,
        origDayOffTable,
      } = state;

      const newEmployeeModels = [...employeeModels];
      const editEmpIndex = newEmployeeModels.findIndex((emp) => emp.uniqueId === uniqueId);
      newEmployeeModels[editEmpIndex][name] = value;
      const newDayOffTable = this.editEmpToDayOffTable(origDayOffTable, editEmpIndex, newEmployeeModels[editEmpIndex]);
      return { employeeModels: newEmployeeModels, origDayOffTable: newDayOffTable, autoDayOffTable: null };
    });
  }

  handleDeleteEmployeeBtnClick = (e) => {
    const uniqueId = Number(e.target.dataset.uniqueId);
    this.setState((state) => {
      const {
        employeeModels,
        origDayOffTable,
      } = state;
      const newEmployeeModels = employeeModels.filter((emp) => emp.uniqueId !== uniqueId);
      const deleteEmpIndex = employeeModels.findIndex((emp) => emp.uniqueId === uniqueId);
      const newDayOffTable = this.deleteEmpToDayOffTable(origDayOffTable, deleteEmpIndex);
      return { employeeModels: newEmployeeModels, origDayOffTable: newDayOffTable, autoDayOffTable: null };
    });
  }

  dayOffTableCellClick = (rowIndex, colIndex) => {
    this.setState((state) => {
      const origDayOffTable = [...state.origDayOffTable];
      origDayOffTable[rowIndex][colIndex] = origDayOffTable[rowIndex][colIndex] === ShiftType.DayOff ? '' : ShiftType.DayOff;
      return { origDayOffTable, autoDayOffTable: null };
    });
  }

  handleGoToStep3Click = () => {
    this.setState((state) => {
      const {
        monthModel,
        employeeModels,
        origDayOffTable,
      } = state;
      const autoDayOffTable = this.getAutoDayOffTable(monthModel, employeeModels, origDayOffTable);
      return { autoDayOffTable };
    });
  }

  getAutoDayOffTable = (monthModel, employeeModels, origDayOffTable) => {
    const autoDayOffTable = this.initialDayOffTable(monthModel, employeeModels, true);
    origDayOffTable.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        if (origDayOffTable[rowIndex][colIndex] === ShiftType.DayOff) {
          autoDayOffTable[rowIndex][colIndex] = ShiftType.DayOff;
        }
      });
    });

    const shiftPlan = new ShiftPlan(monthModel, origDayOffTable, autoDayOffTable);
    return shiftPlan.getAutoDayOffTable();
  }

  render() {
    const {
      yearOptions, roleOptions,
      handleAddEmployeeBtnClick, handleEmployeeChange, handleDeleteEmployeeBtnClick,
      handleYearSelectChange, handleMonthSelectChange, dayOffTableCellClick,
    } = this;
    const {
      selectedYear, selectedMonth, employeeModels, monthModel, origDayOffTable, autoDayOffTable,
    } = this.state;
    const employeeProps = {
      employeeModels, roleOptions, handleAddEmployeeBtnClick, handleEmployeeChange, handleDeleteEmployeeBtnClick,
    };

    return (
      <div className="app">
        <div id="step1" className="step">
          <h2 className="step-header">1. 資料填寫</h2>
          <div className="step-body flex-container-column">
            <div className="flex-item-origin-size">
              <YearMonth
                {...{
                  yearOptions, selectedYear, selectedMonth, handleYearSelectChange, handleMonthSelectChange,
                }}
              />
            </div>
            <div className="flex-item-expand-1">
              <Employee {...employeeProps} />
            </div>
          </div>
          <div className="step-footer">
            <a href="#step2" className="next-step">下一步</a>
          </div>
        </div>
        <div id="step2" className="step">
          <h2 className="step-header">2. 畫休</h2>
          <div className="step-body">
            <PlanDayOffTable {...{
              monthModel, employeeModels, dayOffTable: origDayOffTable, dayOffTableCellClick,
            }}
            />
          </div>
          <div className="step-footer float-right">
            <a href="#step3" className="next-step" onClick={this.handleGoToStep3Click}>下一步</a>
            <a href="#step1" className="last-step">上一步</a>
          </div>
        </div>
        <div id="step3" className="step">
          <h2 className="step-header">3. 自動排休</h2>
          <div className="step-body">
            <AutoPlanDayOffTable {...{
              monthModel, employeeModels, origDayOffTable, autoDayOffTable,
            }}
            />
          </div>
          <div className="step-footer float-right">
            <a href="#step2" className="last-step">上一步</a>
          </div>
        </div>
      </div>
    );
  }
}
