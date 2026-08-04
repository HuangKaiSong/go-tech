declare global {
  namespace Common {
    /** The strategic pattern */
    interface StrategicPattern {
      /** If the condition is true, then call the action function */
      callback: () => void;
      /** The condition */
      condition: boolean;
    }

    /**
     * The option type
     *
     * @property value: The option value
     * @property label: The option label
     */
    type Option<K = string, M = string> = { label: M; value: K };

    type YesOrNo = 'N' | 'Y';

    type EnableStatus = '1' | '2';

    /** Add null to all properties */
    type RecordNullable<T> = {
      [K in keyof T]?: T[K] | null;
    };
  }

  namespace Api.Common {
    /** 分页通用参数 */
    interface PaginatingCommonParams {
      /** 当前页码 */
      current: number;
      /** 每页条数 */
      size: number;
      /** 总条数 */
      total: number;
    }

    /** 分页查询列表数据的通用参数 */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      /** 数据列表 */
      records: T[];
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<Api.Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * 启用状态
     *
     * - "1": 启用
     * - "2": 禁用
     */
    type EnableStatus = '1' | '2';

    /** 通用记录类型 */
    type CommonRecord<T = any> = {
      /** 创建人 */
      createBy: string;
      /** 创建时间 */
      createTime: string;
      /** 记录 ID */
      id: number;
      /** 记录状态 */
      status: EnableStatus | null;
      /** 更新人 */
      updateBy: string;
      /** 更新时间 */
      updateTime: string;
    } & T;
  }
}
