import { defineConfig } from '@go-tech/web-admin-vite';

export default defineConfig({
  application: {
    css: {
      additionalData: '@use "@/styles/scss/global.scss" as *;'
    }
  }
});
