# vite-static-cdn

自动把 `vite` 打包的静态资源，上传到七牛云，支持的静态资源有：

- `asset`
- `chunk`

**当 `cdn` 资源加载失败时，会自动加载原来的静态资源**

## 安装

```shell
npm install vite-static-cdn -D
```

## 使用

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
