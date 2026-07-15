// oxlint-disable unicorn/require-module-specifiers
/**
 * 命名空间 Api.Organization
 *
 * 后端 API 模块：组织架构（部门 / 职位 / 组织图）
 */
declare global {
  namespace Api.Organization {
    /** 将查询表单字段转成可选且允许为空的接口查询参数。 */
    type NullableSearchRecord<T> = {
      [K in keyof T]?: T[K] | null;
    };

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<Api.Common.PaginatingCommonParams, 'current' | 'size'>;

    /** 部门 */
    interface Department {
      /** 部门代码 */
      code: string | null;
      /** 建立日期 */
      createdAt: string;
      /** 部门职责说明 */
      description: string | null;
      /** 部门 ID */
      id: string;
      /** 部门主管 */
      managerName: string | null;
      /** 部门人数 */
      memberCount: number | null;
      /** 部门名称 */
      name: string;
      /** 状态 */
      status: Api.Common.EnableStatus;
    }

    /** 部门搜索参数 */
    type DepartmentSearchParams = NullableSearchRecord<
      Pick<Department, 'code' | 'managerName' | 'name' | 'status'> & CommonSearchParams
    >;

    /** 部门列表 */
    type DepartmentList = Api.Common.PaginatingQueryRecord<Department>;

    /**
     * 职等
     *
     * M 系列为管理岗，P 系列为专业岗
     */
    type RoleLevel = 'M1' | 'M2' | 'M3' | 'P0' | 'P1' | 'P2' | 'P3';

    /** 职位 */
    interface Role {
      /** 建立日期 */
      createdAt: string;
      /** 所属部门 */
      department: string;
      /** 在职人数 */
      headcount: number;
      /** 职位 ID */
      id: string;
      /** 职等 */
      level: RoleLevel;
      /** 薪资范围 */
      salaryRange: string;
      /** 状态 */
      status: Api.Common.EnableStatus;
      /** 职位名称 */
      title: string;
    }

    /** 职位搜索参数 */
    type RoleSearchParams = NullableSearchRecord<
      Pick<Role, 'department' | 'level' | 'status' | 'title'> & CommonSearchParams
    >;

    /** 职位列表 */
    type RoleList = Api.Common.PaginatingQueryRecord<Role>;
  }
}

export { };
