import React, { PureComponent } from 'react';
import './employee.scss';

export default class Employee extends PureComponent {
  render() {
    const {
      employeeModels, roleOptions, handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
    } = this.props;
    const roleSelectOptions = roleOptions.map((role) => <option key={role}>{role}</option>);
    const empList = employeeModels.map((emp) => (
      <div className="employee-flex-item" key={emp.uniqueId}>
        <input value={emp.name} name="name" data-unique-id={emp.uniqueId} onChange={handleEmpDataChange} />
        <select value={emp.role} name="role" data-unique-id={emp.uniqueId} onChange={handleEmpDataChange}>
          {roleSelectOptions}
        </select>
        <button type="button" data-unique-id={emp.uniqueId} onClick={handleEmpDataDelete}>刪除</button>
      </div>
    ));

    return (
      <div className="employee-container flex-container-column">
        <h3 className="flex-item-origin-size">員工資料</h3>
        <button
          className="flex-item-origin-size add-employee-btn"
          type="button"
          onClick={handleAddEmployeeBtnClick}
        >
          新增員工資料
        </button>
        <div className="employee-flex-container flex-item-expand-1">
          {empList}
        </div>
      </div>
    );
  }
}
