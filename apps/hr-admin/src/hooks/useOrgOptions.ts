import { useEffect, useState } from "react";
import { getDepartmentOptions, type DepartmentOption } from "@/api/department";
import { getPositionOptions, type PositionOption } from "@/api/position";

/**
 * 部门 + 职位联动选项。
 * - departments：全部部门（挂载时加载一次）
 * - positions：当前 departmentId 下的职位（departmentId 变化时重新加载；空则清空）
 *
 * 表单状态仍由调用方持有，本 hook 只负责选项数据来源。
 */
export function useOrgOptions(departmentId?: number) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);

  useEffect(() => {
    getDepartmentOptions()
      .then((res) => setDepartments(res.data ?? []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (departmentId == null) {
      setPositions([]);
      return;
    }
    getPositionOptions(departmentId)
      .then((res) => setPositions(res.data ?? []))
      .catch(() => setPositions([]));
  }, [departmentId]);

  return { departments, positions };
}
