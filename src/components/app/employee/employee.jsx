import React from 'react';

export default function Employee(props) {
  const {
    employeeModels, roleOptions, handleAddEmployeeBtnClick, handleEmpDataChange, handleEmpDataDelete,
  } = props;
  const roleSelectOptions = roleOptions.map((role) => <option key={role}>{role}</option>);
  const empList = employeeModels.map((emp) => (
    <div key={emp.index}>
      <input value={emp.name} name="name" data-emp-index={emp.index} onChange={handleEmpDataChange} />
      <select value={emp.role} name="role" data-emp-index={emp.index} onChange={handleEmpDataChange}>
        {roleSelectOptions}
      </select>
      <button type="button" data-emp-index={emp.index} onClick={handleEmpDataDelete}>刪除</button>
    </div>
  ));

  return (
    <div>
      <h3>員工資料</h3>
      <button type="button" onClick={handleAddEmployeeBtnClick}>新增員工資料</button>
      {empList}
    </div>
  );
}
