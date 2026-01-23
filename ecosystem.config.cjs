module.exports = {
  apps: [
    {
      name: "go-tech-next",
      author: "hks",
      out_file: "./logs/go-tech-next.log",
      cwd: "./",
      script: "pnpm",
      args: ["run", "start:h5"],
      env: {
        NODE_ENV: "production",
        VITE_H5_SITE_URL: "http://192.168.0.202:3200",
        NEXT_PUBLIC_API_URL: "http://192.168.0.116:7171",
      },
    },
  ],
};
