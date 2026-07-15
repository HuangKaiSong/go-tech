/** Attendance 加班管理迁移期 Mock 数据（来源：hr-pc-manager OvertimeManagement 原页面） */

export const MOCK_OVERTIME_RECORDS: Api.Attendance.OvertimeRecord[] = [
  { date: '2026-02-25', department: '技術部', hours: 3, id: 'OT001', name: '張小明', reason: '專案上線', status: 'approved' },
  { date: '2026-02-24', department: '技術部', hours: 2, id: 'OT002', name: '黃志偉', reason: 'Bug 修復', status: 'approved' },
  { date: '2026-02-26', department: '財務部', hours: 4, id: 'OT003', name: '林佳蓉', reason: '月結報告', status: 'pending' },
  { date: '2026-02-20', department: '銷售部', hours: 2, id: 'OT004', name: '李文華', reason: '客戶提案', status: 'rejected' },
  { date: '2026-02-18', department: '運營部', hours: 3, id: 'OT005', name: '周建國', reason: '系統維護', status: 'approved' }
];
