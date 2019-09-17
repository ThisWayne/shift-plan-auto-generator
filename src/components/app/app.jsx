import React from 'react';
import './app.scss';
import {
  EmployeeModel, Role, MonthData, ShiftType, ShiftPlan,
} from '../../shift-plan/index';
import Employee from '../employee/employee';
import YearMonth from '../year-month/year-month';
import PlanDayOffTable from '../plan-day-off-table/plan-day-off-table';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    const date = new Date();
    const nextMonth = (this.thisMonth + 1) % 12;
    const thisYear = date.getFullYear();
    const thisMonth = date.getMonth();
    const selectedYear = nextMonth === 0 ? thisYear + 1 : thisYear;
    const selectedMonth = (thisMonth + 1) % 12;
    const monthData = new MonthData({ year: selectedYear, month: selectedMonth });
    this.shiftPlan = new ShiftPlan(monthData, []);
    const dayOffTable = this.shiftPlan.origDayOffTable;
    this.yearOptions = [thisYear, thisYear + 1];
    this.roleOptions = Object.values(Role);
    this.state = {
      selectedYear,
      selectedMonth,
      monthData,
      dayOffTable,
      employeeModels: [],
      employeeIndexCounter: 0,
    };
  }

  handleYearSelectChange = (e) => {
    const selectedYear = e.target.value;
    this.setState((state) => {
      const monthData = new MonthData({ year: selectedYear, month: state.selectedMonth });
      this.shiftPlan = new ShiftPlan(monthData, state.employeeModels);
      return { selectedYear, monthData, dayOffTable: this.shiftPlan.origDayOffTable };
    });
  }

  handleMonthSelectChange = (e) => {
    const selectedMonth = e.target.value;
    this.setState((state) => {
      const monthData = new MonthData({ year: state.selectedYear, month: selectedMonth });
      this.shiftPlan = new ShiftPlan(monthData, state.employeeModels);
      return { selectedMonth, monthData, dayOffTable: this.shiftPlan.origDayOffTable };
    });
  }

  handleAddEmployeeBtnClick = () => {
    this.setState((state) => {
      const { employeeIndexCounter, employeeModels } = state;
      const role = employeeIndexCounter === 0 ? Role.MG : Role.FT;
      const newEmp = new EmployeeModel({
        uniqueId: employeeIndexCounter, index: employeeModels.length, name: `姓名${employeeIndexCounter}`, role,
      });
      const newEmployeeModels = [...employeeModels, newEmp];
      this.shiftPlan.addEmployeeModel(newEmp);
      return {
        employeeModels: newEmployeeModels,
        employeeIndexCounter: employeeIndexCounter + 1,
        dayOffTable: this.shiftPlan.origDayOffTable,
      };
    });
  }

  handleEmpDataChange = (e) => {
    const { name, value } = e.target;
    const uniqueId = Number(e.target.dataset.uniqueId);
    this.setState((state) => {
      const employeeModels = [...state.employeeModels];
      const editEmp = employeeModels.find((emp) => emp.uniqueId === uniqueId);
      editEmp[name] = value;
      this.shiftPlan.editEmployeeModel(editEmp);
      return { employeeModels, dayOffTable: this.shiftPlan.origDayOffTable };
    });
  }

  handleEmpDataDelete = (e) => {
    const uniqueId = Number(e.target.dataset.uniqueId);
    this.setState((state) => {
      const employeeModels = state.employeeModels.filter((emp) => emp.uniqueId !== uniqueId);
      this.shiftPlan.deleteEmployeeModel(uniqueId);
      return { employeeModels, dayOffTable: this.shiftPlan.origDayOffTable };
    });
  }

  dayOffTableCellClick = (rowIndex, colIndex) => {
    this.setState((state) => {
      const dayOffTable = [...state.dayOffTable];
      dayOffTable[rowIndex][colIndex] = dayOffTable[rowIndex][colIndex] === ShiftType.DayOff ? null : ShiftType.DayOff;
      return { dayOffTable };
    });
  }

  render() {
    const {
      yearOptions, roleOptions,
      handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
      handleYearSelectChange, handleMonthSelectChange,
      dayOffTableCellClick,
    } = this;
    const {
      selectedYear, selectedMonth, employeeModels, monthData, dayOffTable,
    } = this.state;

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
              <Employee {...{
                employeeModels, roleOptions, handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
              }}
              />
            </div>
          </div>
          <div className="step-footer">
            <a href="#step2" className="float-right">下一步</a>
          </div>
        </div>
        <div id="step2" className="step">
          <h2 className="step-header">2. 畫休</h2>
          <div className="step-body">
            <PlanDayOffTable {...{
              monthData, employeeModels, dayOffTable, dayOffTableCellClick,
            }}
            />
          </div>
          <div className="step-footer float-right">
            <a href="#step3" className="float-right">下一步</a>
            <a href="#step1" className="float-right">上一步</a>
          </div>
        </div>
        <div id="step3" className="step">
          <h2 className="step-header">3. 自動排休</h2>
          <div className="step-body" />
          <div className="step-footer float-right">
            <a href="#step2" className="float-right">上一步</a>
          </div>
        </div>
      </div>
    );
  }
}
