import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import ViteStaticCDN from "../src/vite";

export default defineConfig({
  plugins: [
    Inspect(),
    ViteStaticCDN({
      host: "http://baidu.com",
      async customUpload({ localFilePath, filename, mimeType }) {
        console.table({ localFilePath, filename, mimeType });
        // 上传失败时抛出错误，cdn链接不会成功替换，原资源文件会被保留
        throw new Error("上传失败");
      },
    }),
  ],
});
