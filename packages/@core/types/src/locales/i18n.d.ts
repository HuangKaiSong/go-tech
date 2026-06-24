// oxlint-disable unicorn/require-module-specifiers
/** Shared i18n type primitives and extension points */
declare global {
  namespace I18n {
    interface LangRegistry {
      'en-Us': true;
      'zh-TW': true;
    }

    type LangType = keyof LangRegistry extends never ? string : Extract<keyof LangRegistry, string>;

    type LangOption = {
      key: LangType;
      label: string;
    };
  }
}

export {};
