/** 数据库注释规范；通过版本化 SQL 迁移写入，覆盖全部监控表与字段。 */
export const monitorComments = {
  monitor_reports: {
    table: '监控报告索引与脱敏摘要',
    columns: {
      id: '报告唯一标识（UUID，重复上传不覆盖原记录）',
      schema_version: '监控报告协议版本号',
      report_kind: '报告大类：error 错误或 performance 性能',
      error_kind: '错误来源分类，性能报告为空',
      occurred_at_ms: '报告原始发生时间（Unix 毫秒）',
      received_at_ms: '监控服务首次接收时间（Unix 毫秒）',
      expires_at_ms: '报告过期时间（Unix 毫秒，查询时直接排除过期记录）',
      time_source: '发生时间来源：client 客户端或 server 服务端',
      session_id: '客户端会话唯一标识（UUID）',
      page_id: '页面文档唯一标识（UUID）',
      path: '页面完整路径，不含查询参数与片段',
      path_hash: '完整页面路径的 SHA-256 哈希，用于精确路径筛选索引',
      release: '应用发布版本标识',
      user_id: '认证上下文中的用户标识，匿名报告可为空',
      summary_json: '脱敏摘要的 JSON 文本字符串，不含回放事件、Token 或认证 Cookie',
      replay_event_count: '浏览器回放事件数量，无回放时为零',
      payload_sha256: '完整规范报告及原接收时间的 SHA-256 校验值'
    }
  },
  monitor_report_payloads: {
    table: '监控报告详情与独立加密的认证凭证',
    columns: {
      report_id: '关联报告唯一标识（UUID，随报告级联删除）',
      payload_json: '移除回放事件和明文凭证后的报告 JSON 文本字符串，保留数值精度',
      auth_ciphertext: '认证 Token 与 Cookie 的 AES-256-GCM 密文，包含随机数及认证标签',
      auth_key_version: '认证凭证加密密钥版本，密钥本身不入库'
    }
  },
  monitor_replays: {
    table: '浏览器回放事件压缩存储，无回放的报告不创建记录',
    columns: {
      report_id: '关联报告唯一标识（UUID，随报告级联删除）',
      codec: '回放编码格式，当前为 gzip-json',
      events_blob: '按原顺序保存的回放事件 JSON 数组压缩二进制内容',
      uncompressed_bytes: '事件 JSON 解压后的字节数，用于容量及完整性校验',
      sha256: '未压缩事件 JSON 内容的 SHA-256 校验值'
    }
  },
  monitor_import_runs: {
    table: '历史文件迁移任务审计记录，文件存储停用后保留用于追溯',
    columns: {
      id: '历史导入任务唯一标识（UUID）',
      source_hash: '历史源目录绝对路径的 SHA-256 哈希，不保存明文路径',
      started_at_ms: '历史导入任务开始时间（Unix 毫秒）',
      completed_at_ms: '历史导入任务结束时间（Unix 毫秒），未结束时为空',
      status: '历史导入任务状态：running、complete 或 blocked'
    }
  },
  monitor_import_items: {
    table: '历史报告迁移结果与校验检查点，不保存凭证明文',
    columns: {
      source_hash: '历史源目录标识哈希，与源报告标识组成联合主键',
      file_id: '历史源报告文件对应的报告唯一标识（UUID）',
      content_hash: '历史源报告及原接收时间的规范内容 SHA-256 校验值',
      run_id: '最近一次核验该报告的历史导入任务标识（UUID）',
      status: '历史迁移结果：imported、duplicate、expired、conflict 或 invalid',
      error_class: '迁移异常分类，不包含凭证值或原始报告内容',
      checked_at_ms: '最近一次迁移核验时间（Unix 毫秒）'
    }
  },
  monitor_schema_migrations: {
    table: '监控服务专用结构迁移记录，与业务应用迁移记录独立',
    columns: {
      id: '结构迁移记录自增主键',
      hash: '已执行 SQL 迁移文件的 SHA-256 校验值',
      created_at: '迁移文件生成时间戳（Unix 毫秒），用于版本顺序判断'
    }
  }
} satisfies Record<string, { columns: Record<string, string>; table: string }>;
