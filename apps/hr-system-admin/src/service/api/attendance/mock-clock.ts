/** Attendance 打卡管理迁移期 Mock 数据（来源：hr-pc-manager ClockInManagement 原页面） */

export const MOCK_CLOCK_LOCATIONS: Api.Attendance.ClockLocation[] = [
  {
    address: '台北市信義區信義路五段7號',
    enabled: true,
    id: 'L1',
    lat: '25.0330',
    lng: '121.5654',
    name: '總部大樓',
    radius: 200,
    ruleId: 'R1',
    wifiSSID: 'HQ-Office'
  },
  {
    address: '新竹市東區光復路二段101號',
    enabled: true,
    id: 'L2',
    lat: '24.8015',
    lng: '120.9718',
    name: '新竹研發中心',
    radius: 150,
    ruleId: 'R1',
    wifiSSID: 'RD-Center'
  },
  {
    address: '台中市西屯區台灣大道三段99號',
    enabled: false,
    id: 'L3',
    lat: '24.1627',
    lng: '120.6466',
    name: '台中分公司',
    radius: 300,
    ruleId: 'R2',
    wifiSSID: ''
  }
];

export const MOCK_CLOCK_SCHEDULES: Api.Attendance.ClockSchedule[] = [
  {
    breakEnd: '13:00',
    breakStart: '12:00',
    earlyLeaveGrace: 5,
    enabled: true,
    id: 'S1',
    lateGrace: 5,
    name: '標準班',
    type: 'fixed',
    workDays: [1, 2, 3, 4, 5],
    workEnd: '18:00',
    workStart: '09:00'
  },
  {
    breakEnd: '13:00',
    breakStart: '12:00',
    earlyLeaveGrace: 0,
    enabled: true,
    id: 'S2',
    lateGrace: 30,
    name: '彈性班',
    type: 'flexible',
    workDays: [1, 2, 3, 4, 5],
    workEnd: '17:00',
    workStart: '08:00'
  },
  {
    breakEnd: '11:30',
    breakStart: '11:00',
    earlyLeaveGrace: 5,
    enabled: true,
    id: 'S3',
    lateGrace: 5,
    name: '輪班制 A',
    type: 'shift',
    workDays: [1, 2, 3, 4, 5, 6],
    workEnd: '15:00',
    workStart: '07:00'
  }
];

export const MOCK_CLOCK_RULES: Api.Attendance.ClockRule[] = [
  {
    allowMethods: ['gps', 'wifi', 'face'],
    allowRemote: true,
    appealDeadlineDays: 3,
    enabled: true,
    id: 'R1',
    missedClockAllowAppeal: true,
    name: '預設打卡規則',
    overtimeAuto: true,
    overtimeMinMinutes: 30,
    remoteApproval: true,
    requireLocation: true,
    requirePhoto: false
  },
  {
    allowMethods: ['gps', 'face'],
    allowRemote: false,
    appealDeadlineDays: 1,
    enabled: false,
    id: 'R2',
    missedClockAllowAppeal: true,
    name: '嚴格模式',
    overtimeAuto: false,
    overtimeMinMinutes: 60,
    remoteApproval: false,
    requireLocation: true,
    requirePhoto: true
  }
];
