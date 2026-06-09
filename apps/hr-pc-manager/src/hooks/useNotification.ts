export function useNotification() {
  const sendNotification = (message: string, options?: NotificationOptions) => {
    if (!("Notification" in window)) {
      console.warn("浏览器不支持通知功能");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("没有通知权限");
      return;
    }

    const defaultOptions: NotificationOptions = {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
      body: message,
    };

    new Notification('HR 管理系統', defaultOptions);
  };

  return { sendNotification };
}
