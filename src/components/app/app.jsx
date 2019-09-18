import React from 'react';
import './app.scss';
import {
  EmployeeModel, Role, MonthData, ShiftPlan,
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
    const monthData = new MonthData({ year: selectedYear, month: selectedMonth });
    const shiftPlan = new ShiftPlan(monthData, []);
    this.yearOptions = [thisYear, thisYear + 1];
    this.roleOptions = Object.values(Role);
    this.state = {
      selectedYear,
      selectedMonth,
      monthData,
      shiftPlan,
      employeeModels: [],
      employeeIndexCounter: 0,
    };
  }

  handleYearSelectChange = (e) => {
    const selectedYear = e.target.value;
    this.setState((state) => {
      const monthData = new MonthData({ year: selectedYear, month: state.selectedMonth });
      const shiftPlan = new ShiftPlan(monthData, state.employeeModels);
      return { selectedYear, monthData, shiftPlan };
    });
  }

  handleMonthSelectChange = (e) => {
    const selectedMonth = e.target.value;
    this.setState((state) => {
      const monthData = new MonthData({ year: state.selectedYear, month: selectedMonth });
      const shiftPlan = new ShiftPlan(monthData, state.employeeModels);
      return { selectedMonth, monthData, shiftPlan };
    });
  }

  handleAddEmployeeBtnClick = () => {
    this.setState((state) => {
      const { employeeIndexCounter, employeeModels, shiftPlan } = state;
      const role = employeeIndexCounter === 0 ? Role.MG : Role.FT;
      const newEmp = new EmployeeModel({
        uniqueId: employeeIndexCounter, index: employeeModels.length, name: `姓名${employeeIndexCounter}`, role,
      });
      shiftPlan.addEmployeeModel(newEmp);
      return {
        employeeModels: [...employeeModels, newEmp],
        employeeIndexCounter: employeeIndexCounter + 1,
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
      state.shiftPlan.editEmployeeModel(editEmp);
      return { employeeModels };
    });
  }

  handleEmpDataDelete = (e) => {
    const uniqueId = Number(e.target.dataset.uniqueId);
    this.setState((state) => {
      const employeeModels = state.employeeModels.filter((emp) => emp.uniqueId !== uniqueId);
      state.shiftPlan.deleteEmployeeModel(uniqueId);
      return { employeeModels };
    });
  }

  dayOffTableCellClick = (rowIndex, colIndex) => {
    this.setState((state) => {
      state.shiftPlan.flipDayOffCell({ rowIndex, colIndex });
      return { shiftPlan: state.shiftPlan };
    });
  }

  handleGoToStep3Click = () => {
    this.setState((state) => {
      state.shiftPlan.start();
      return { shiftPlan: state.shiftPlan };
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
      selectedYear, selectedMonth, employeeModels, monthData, shiftPlan,
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
            <a href="#step2" className="next-step">下一步</a>
          </div>
        </div>
        <div id="step2" className="step">
          <h2 className="step-header">2. 畫休</h2>
          <div className="step-body">
            <PlanDayOffTable {...{
              monthData, employeeModels, dayOffTable: shiftPlan.origDayOffTable, dayOffTableCellClick,
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
              monthData, employeeModels, origDayOffTable: shiftPlan.origDayOffTable, autoDayOffTable: shiftPlan.autoDayOffTable,
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
