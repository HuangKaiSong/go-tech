export default function useWifiInfo() {
  // 目标的登录页或初始化接口
  const url = 'http://192.168.0.1/webpages/login.html';

  async function getRouterLogin() {
    try {
      const response = await fetch(url, {
        mode: 'no-cors'
      });

      console.log('状态码:', response.status);

      // 如果使用了 mode: "no-cors"，状态码会变成 0，这是正常现象（不影响Cookie的写入）
      if (response.ok || response.status === 0) {
        console.log('请求发送成功！');
      } else {
        const errText = await response.text();
        console.error('失败原因:', errText);
      }
    } catch (error) {
      console.error('网络请求发生致命错误（可能是跨域被浏览器直接拦截了）:', error);
    }
  }

  return {
    getRouterLogin
  };
}
