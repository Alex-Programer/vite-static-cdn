// src/index.ts
import { readFile, writeFile } from "fs/promises";
import { JSDOM } from "jsdom";
import mime from "mime-types";
import { basename, join, resolve } from "path";
import qiniu from "qiniu";
var ViteStaticCDN = (options) => {
  const { accessKey, secretKey, bucket } = options.qiniuConfig;
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const qiniuOptions = {
    scope: bucket,
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
  };
  const putPolicy = new qiniu.rs.PutPolicy(qiniuOptions);
  const uploadToken = putPolicy.uploadToken(mac);
  const config = new qiniu.conf.Config();
  const formUploader = new qiniu.form_up.FormUploader(config);
  const putExtra = new qiniu.form_up.PutExtra();
  const uploadSingleFile = async (localFilePath) => {
    const filename = basename(localFilePath);
    putExtra.mimeType = mime.lookup(filename) || "application/octet-stream";
    let key = join(options.basePath || "/", filename);
    if (key.startsWith("/"))
      key = key.slice(1);
    return new Promise((resolve2, reject) => {
      formUploader.putFile(uploadToken, key, localFilePath, putExtra, function(respErr, respBody, respInfo) {
        if (respErr) {
          reject(respErr);
          throw respErr;
        }
        if (respInfo.statusCode == 200) {
          const url = new URL(key, options.host);
          resolve2(url.toString());
        } else {
          console.log("-----------\u8D44\u6E90\u4E0A\u4F20\u5931\u8D25-----------");
          reject({ respBody, respInfo });
        }
      });
    });
  };
  return {
    name: "vite-static-cdn",
    async writeBundle({ dir }, bundle) {
      const assets = [];
      const htmlPath = resolve(dir, "index.html");
      for (const path in bundle) {
        const file = bundle[path];
        if (file.fileName.endsWith(".html"))
          continue;
        switch (file.type) {
          case "asset":
          case "chunk":
            try {
              const localFilePath = join(dir, file.fileName);
              const cdn = await uploadSingleFile(localFilePath);
              assets.push({ source: file.fileName, cdn });
            } catch (error) {
              console.error(error);
              console.error(`\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF1A${file.fileName}`);
            }
            break;
        }
      }
      const html = await readFile(htmlPath, "utf-8");
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const scripts = Array.from(document.getElementsByTagName("script"));
      for (const script of scripts) {
        const assetScript = assets.find((item) => script.src.includes(item.source));
        if (assetScript) {
          const source = script.src;
          script.src = assetScript.cdn;
          const backupScript = `
            const newScript = document.createElement('script');
            newScript.src='${source}';
            document.body.append(newScript);
          `;
          script.setAttribute("onerror", backupScript);
        }
      }
      const links = Array.from(document.getElementsByTagName("link"));
      for (const link of links) {
        const assetLink = assets.find((item) => link.href.includes(item.source));
        if (assetLink) {
          const source = link.href;
          link.href = assetLink.cdn;
          const backupLink = `
            const newLink = document.createElement('link');
            newLink.setAttribute('rel', 'stylesheet');
            newLink.href='${source}';
            document.head.append(newLink);
          `;
          link.setAttribute("onerror", backupLink);
        }
      }
      const newHtml = dom.serialize();
      await writeFile(htmlPath, newHtml, "utf-8");
    }
  };
};
var src_default = ViteStaticCDN;

export {
  src_default
};
