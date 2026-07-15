async function bootstrap() {
  if (import.meta.env.DEV) {
    await import('@go-tech/web-admin-devtools/jotai');
  }

  await import('./bootstrap');
}

bootstrap();
