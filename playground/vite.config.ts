import { defineConfig, loadEnv } from "vite";
import Inspect from "vite-plugin-inspect";
import ViteStaticCDN from "../src/vite";

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };
  const { VITE_HOST, VITE_ACCESS_KEY, VITE_SECRET_KEY, VITE_BUCKET } = process.env;

  return {
    plugins: [
      Inspect(),
      ViteStaticCDN({
        host: VITE_HOST!,
        qiniuConfig: {
          accessKey: VITE_ACCESS_KEY!,
          secretKey: VITE_SECRET_KEY!,
          bucket: VITE_BUCKET!,
        },
      }),
    ],
  };
});
