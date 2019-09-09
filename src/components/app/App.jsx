import React from 'react';
import './app.css';
import { EmployeeModel, Role } from '../shift-plan/index';
import Employee from './employee/employee';
import YearMonth from './year-month/year-month';

class App extends React.Component {
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

  render() {
    const {
      yearOptions, roleOptions,
      handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
      handleYearSelectChange, handleMonthSelectChange,
    } = this;
    const { selectedYear, selectedMonth, employeeModels } = this.state;

    return (
      <div className="app">
        <div id="step1" className="step">
          <h2>1. 資料填寫</h2>
          <div>
            <YearMonth
              {...{
                yearOptions, selectedYear, selectedMonth, handleYearSelectChange, handleMonthSelectChange,
              }}
            />
            <Employee {...{
              employeeModels, roleOptions, handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
            }}
            />
          </div>
        </div>
        <div id="step2" className="step">test</div>
        <div id="step3" className="step">test</div>
      </div>
    );
  }
}

export default App;
