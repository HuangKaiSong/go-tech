export type ConfigStore = 'business' | 'infrastructure';
export interface ConfigDefinition {
  default?: string;
  group: string;
  public?: boolean;
  required?: boolean;
  secret?: boolean;
  store: ConfigStore;
  type: 'boolean' | 'locale' | 'provider' | 'string' | 'timezone' | 'url';
}
const infrastructure = (group: string): ConfigDefinition => ({
  store: 'infrastructure',
  type: 'string',
  group,
  secret: true,
  required: true
});
const business = (
  group: string,
  type: ConfigDefinition['type'] = 'string',
  extra: Partial<ConfigDefinition> = {}
): ConfigDefinition => ({ store: 'business', type, group, ...extra });
export const definitions = {
  DATABASE_URL: infrastructure('数据库'),
  REDIS_URL: infrastructure('Redis'),
  SESSION_SECRET: infrastructure('会话'),
  PLATFORM_JWT_SECRET: infrastructure('管理员认证'),
  API_INTERNAL_URL: business('业务接口', 'url'),
  NEXT_PUBLIC_API_URL: business('业务接口', 'url'),
  NEXT_PUBLIC_PMS_TRIAL_HOST: business('试用地址', 'url', { public: true }),
  NEXT_PUBLIC_PMS_TRIAL_MOBILE_HOST: business('试用地址', 'url', { public: true }),
  NEXT_PUBLIC_HR_TRIAL_HOST: business('试用地址', 'url', { public: true }),
  NEXT_PUBLIC_KPAY_ENABLE: business('支付', 'boolean', { public: true, default: 'false' }),
  NEXT_PUBLIC_KPAY_CASHIER_URL: business('支付', 'url', {
    required: true,
    public: true,
    default: 'https://payment.uat.kpay-group.com/v1/web/managed/order'
  }),
  GO_TECH_LANGUAGE: business('站点', 'locale', { required: true, public: true, default: 'zh-hk' }),
  GO_TECH_TIMEZONE: business('站点', 'timezone', { required: true, public: true, default: 'Asia/Hong_Kong' }),
  NEXT_PUBLIC_SITE_URL: business('站点', 'url', { required: true, public: true, default: 'https://go-techs.com' }),
  TRANSLATION_PROVIDER: business('翻译', 'provider', { required: true, default: 'deepl' }),
  DEEPL_API_KEY: business('翻译', 'string', { secret: true }),
  GOOGLE_TRANSLATE_API_KEY: business('翻译', 'string', { secret: true }),
  QIANWEN_API_KEY: business('内容审核', 'string', { secret: true }),
  QIANWEN_MODEL_NAME: business('内容审核', 'string', { required: true, default: 'qwen3.7-plus' }),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: business('验证码', 'string', { public: true }),
  TURNSTILE_SECRET_KEY: business('验证码', 'string', { secret: true }),
  FEEDBACK_AI_URL: business('Feedback AI', 'url', { default: 'http://127.0.0.1:8100' }),
  FEEDBACK_AI_INTERNAL_TOKEN: business('Feedback AI', 'string', { secret: true }),
  NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN: business('BetterStack', 'string', { secret: true }),
  NEXT_PUBLIC_BETTERSTACK_INGEST_URL: business('BetterStack', 'url'),
  NEXT_PUBLIC_BROWSER_MONITOR_ENABLED: business('监控', 'boolean', { public: true, default: 'false' }),
  NEXT_PUBLIC_BROWSER_MONITOR_RELEASE: business('监控', 'string', { public: true }),
  BROWSER_MONITOR_SERVICE_URL: business('监控', 'url'),
  BROWSER_MONITOR_INGEST_TOKEN: business('监控', 'string', { secret: true }),
  BROWSER_MONITOR_QUERY_TOKEN: business('监控', 'string', { secret: true }),
  BROWSER_MONITOR_ALLOWED_ORIGINS: business('监控')
} satisfies Record<string, ConfigDefinition>;
export type ConfigKey = keyof typeof definitions;
export type ConfigValues = Partial<Record<ConfigKey, string>>;
export interface PublicSnapshot {
  values: ConfigValues;
  version: string;
}
export function isConfigKey(key: string): key is ConfigKey {
  return Object.hasOwn(definitions, key);
}
export function definition(key: ConfigKey): ConfigDefinition {
  return definitions[key];
}
export function effectiveValues(
  overrides: ConfigValues,
  env: Record<string, string | undefined> = process.env
): ConfigValues {
  return Object.fromEntries(
    Object.keys(definitions).map(key => [
      key,
      overrides[key as ConfigKey] ?? (env[key] || definition(key as ConfigKey).default || '')
    ])
  );
}
export function publicValues(values: ConfigValues): ConfigValues {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => isConfigKey(key) && definition(key).public && !definition(key).secret)
  );
}
export class ConfigError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}
export function parseChanges(value: unknown, store: ConfigStore): Partial<Record<ConfigKey, string | null>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ConfigError('配置格式无效');
  const result: Partial<Record<ConfigKey, string | null>> = {};
  for (const [key, input] of Object.entries(value)) {
    if (!isConfigKey(key) || definition(key).store !== store) throw new ConfigError('包含不允许修改的配置项');
    if (input !== null && typeof input !== 'string') throw new ConfigError(`${key} 必须为字符串或 null`);
    if (typeof input === 'string' && input.length > 8192) throw new ConfigError(`${key} 过长`);
    if (input !== null) validateValue(key, input);
    result[key] = input;
  }
  return result;
}
export function validateValue(key: ConfigKey, value: string) {
  const type = definition(key).type;
  if (!value) {
    if (definition(key).required) throw new ConfigError(`${key} 不允许为空`);
    return;
  }
  if (type === 'boolean' && !['true', 'false'].includes(value)) throw new ConfigError(`${key} 必须为 true 或 false`);
  if (type === 'locale' && !['zh-hk', 'zh-cn', 'en-us'].includes(value)) throw new ConfigError('不支持的语言');
  if (type === 'provider' && !['deepl', 'google'].includes(value))
    throw new ConfigError('目前仅支持 DeepL 和 Google 翻译');
  if (type === 'timezone') {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions();
    } catch {
      throw new ConfigError('时区无效');
    }
  }
  if (type === 'url' || key === 'DATABASE_URL' || key === 'REDIS_URL') validateAddress(key, value);
  if ((key === 'SESSION_SECRET' || key === 'PLATFORM_JWT_SECRET') && value.length < 32)
    throw new ConfigError(`${key} 至少需要 32 个字符`);
  if (key === 'BROWSER_MONITOR_ALLOWED_ORIGINS') validateOrigins(value);
}
function validateAddress(key: ConfigKey, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigError(`${key} 地址无效`);
  }
  let protocols = ['https:', 'http:'];
  if (key === 'DATABASE_URL') protocols = ['mysql:'];
  if (key === 'REDIS_URL') protocols = ['redis:', 'rediss:'];
  if (!protocols.includes(url.protocol) || (definition(key).type === 'url' && (url.username || url.password)))
    throw new ConfigError(`${key} 地址协议或凭证无效`);
}
function validateOrigins(value: string) {
  for (const origin of value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)) {
    try {
      const url = new URL(origin);
      if (!['https:', 'http:'].includes(url.protocol) || url.origin !== origin) throw new Error('Invalid origin');
    } catch {
      throw new ConfigError('监控来源必须为逗号分隔的 HTTP(S) origin');
    }
  }
}

export function validatePairs(values: ConfigValues, changes: Partial<Record<ConfigKey, string | null>>) {
  for (const [left, right] of [
    ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'TURNSTILE_SECRET_KEY'],
    ['NEXT_PUBLIC_BETTERSTACK_INGEST_URL', 'NEXT_PUBLIC_BETTERSTACK_SOURCE_TOKEN']
  ] as const) {
    if ((left in changes || right in changes) && Boolean(values[left]) !== Boolean(values[right]))
      throw new ConfigError(`${left} 与 ${right} 需要成对配置或清除`);
  }
}
