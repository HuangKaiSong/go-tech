// 副作用导入：注册 jest-dom 自定义断言，无需赋值给变量。
// oxlint-disable-next-line import/no-unassigned-import -- 有意的测试副作用导入
import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});
