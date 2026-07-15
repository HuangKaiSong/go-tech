/** Attendance 模块迁移期 Mock 数据（来源：hr-pc-manager AttendanceRecords 原页面） */

type RawRecord = Omit<Api.Attendance.AttendanceRecord, 'id'>;

const RAW: RawRecord[] = [
  { clockIn: '08:55', clockOut: '18:05', date: '2026-01-05', department: '技術部', name: '張小明', status: 'normal' },
  { clockIn: '09:15', clockOut: '18:30', date: '2026-01-06', department: '銷售部', name: '李文華', status: 'late' },
  { clockIn: '08:50', clockOut: '18:00', date: '2026-01-07', department: '人事部', name: '王美玲', status: 'normal' },
  { clockIn: '-', clockOut: '-', date: '2026-01-08', department: '市場部', name: '陳大偉', status: 'leave' },
  { clockIn: '08:45', clockOut: '17:55', date: '2026-01-10', department: '財務部', name: '林佳蓉', status: 'normal' },
  { clockIn: '09:20', clockOut: '18:25', date: '2026-02-04', department: '銷售部', name: '李文華', status: 'late' },
  { clockIn: '-', clockOut: '-', date: '2026-02-06', department: '市場部', name: '陳大偉', status: 'absent' },
  { clockIn: '08:40', clockOut: '17:50', date: '2026-02-07', department: '財務部', name: '林佳蓉', status: 'normal' },
  { clockIn: '09:05', clockOut: '18:15', date: '2026-03-03', department: '技術部', name: '趙志強', status: 'late' },
  { clockIn: '08:30', clockOut: '17:30', date: '2026-03-03', department: '銷售部', name: '黃雅琪', status: 'normal' },
  { clockIn: '-', clockOut: '-', date: '2026-03-03', department: '運營部', name: '周建國', status: 'absent' },
  { clockIn: '08:50', clockOut: '17:20', date: '2026-03-04', department: '技術部', name: '張小明', status: 'early' },
  { clockIn: '-', clockOut: '-', date: '2026-03-04', department: '銷售部', name: '李文華', status: 'rest' },
  { clockIn: '08:45', clockOut: '18:00', date: '2026-03-04', department: '人事部', name: '王美玲', status: 'normal' },
  { clockIn: '08:40', clockOut: '17:10', date: '2026-03-05', department: '財務部', name: '林佳蓉', status: 'early' },
  { clockIn: '-', clockOut: '-', date: '2026-03-07', department: '人事部', name: '王美玲', status: 'leave' }
];

export const MOCK_ATTENDANCE_RECORDS: Api.Attendance.AttendanceRecord[] = RAW.map((item, index) => ({
  ...item,
  id: `AR${String(index + 1).padStart(3, '0')}`
}));
