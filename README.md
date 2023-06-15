# vite-static-cdn

自动把 `vite` 打包的静态资源，自动上传静态资源到 cdn 服务器，支持的静态资源有：

- `asset`
- `chunk`

**当 `cdn` 资源加载失败时，会自动加载原来的静态资源兜底**

## 安装

```shell
npm install vite-static-cdn -D
```

## 使用

### 上传到七牛云

```ts
import { defineConfig } from "vite";
import ViteStaticCDN from "vite-static-cdn";

export default defineConfig({
  plugins: [
    ViteStaticCDN({
      /** 七牛云的空间域名 */
      host: string;
      /** 文件上传到七牛云上的路径前缀，最后资源的访问路径为：host + basePath + 文件名 */
      basePath?: string;
      qiniuConfig: {
        accessKey: "xxx",
        secretKey: "xxx",
        bucket: "xxx",
      },
    }),
  ],
});
```

### 自定义上传

```ts
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import ViteStaticCDN from "vite-static-cdn";

export default defineConfig({
  plugins: [
    Inspect(),
    ViteStaticCDN({
      host: "http://xxx",
      async customUpload({ localFilePath, filename, mimeType }) {
        // 上传成功后，必须返回 Promise<string> 数据类型来执行后续逻辑

        // 如果上传失败时，就抛出错误，cdn链接不会被替换，原资源文件会继续保留
        throw new Error("上传失败");
      },
    }),
  ],
});
```
