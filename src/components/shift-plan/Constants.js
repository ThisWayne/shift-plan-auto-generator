const Day = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  0: '日',
  7: '日',
};

const Role = {
  MG: '店',
  FT: '正',
  PT: '兼',
};

const ShiftType = {
  MoringShift: '1',
  NightShift: '2',
  NightShiftOvertime: '2+',
  FullDay: '全',
  DayOff: 'X',
};

const MaxShiftSeq = 4;

export {
  Day, Role, ShiftType, MaxShiftSeq,
};
