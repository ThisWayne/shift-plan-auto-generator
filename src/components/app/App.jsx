import React from 'react';
import './app.scss';
import { EmployeeModel, Role, MonthData } from '../../shift-plan/index';
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
    this.yearOptions = [thisYear, thisYear + 1];
    this.roleOptions = Object.values(Role);
    this.state = {
      selectedYear: nextMonth === 0 ? thisYear + 1 : thisYear,
      selectedMonth: (thisMonth + 1) % 12,
      monthData: null,
      employeeModels: [],
      employeeIndexCounter: 0,
    };
  }

  handleYearSelectChange = (e) => {
    this.setState({ selectedYear: e.target.value });
  }

  handleMonthSelectChange = (e) => {
    this.setState({ selectedMonth: e.target.value });
  }

  handleAddEmployeeBtnClick = () => {
    this.setState((state) => {
      const empIndex = state.employeeIndexCounter;
      const role = empIndex === 0 ? Role.MG : Role.FT;
      const newEmp = new EmployeeModel({ index: empIndex, name: `姓名${empIndex}`, role });
      return { employeeModels: [...state.employeeModels, newEmp], employeeIndexCounter: empIndex + 1 };
    });
  }

  handleEmpDataChange = (e) => {
    const { name, value } = e.target;
    const empIndex = Number(e.target.dataset.empIndex);
    this.setState((state) => {
      const { employeeModels } = state;
      employeeModels.find((emp) => emp.index === empIndex)[name] = value;
      return { employeeModels: [...state.employeeModels] };
    });
  }

  handleEmpDataDelete = (e) => {
    const empIndex = Number(e.target.dataset.empIndex);
    this.setState((state) => {
      const { employeeModels } = state;
      return { employeeModels: [...employeeModels.filter((emp) => emp.index !== empIndex)] };
    });
  }

  handleGoToStep2Click = () => {
    this.setState((state) => {
      const { selectedYear: year, selectedMonth: month } = state;
      return { monthData: new MonthData({ year, month }) };
    });
  }

  render() {
    const {
      yearOptions, roleOptions,
      handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
      handleYearSelectChange, handleMonthSelectChange, handleGoToStep2Click,
    } = this;
    const {
      selectedYear, selectedMonth, employeeModels, monthData,
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
            <a href="#step2" className="float-right" onClick={handleGoToStep2Click}>下一步</a>
          </div>
        </div>
        <div id="step2" className="step">
          <h2 className="step-header">2. 畫休</h2>
          <div className="step-body">
            <PlanDayOffTable {...{ monthData, employeeModels }} />
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
