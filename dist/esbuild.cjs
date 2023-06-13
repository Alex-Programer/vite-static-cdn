"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/esbuild.ts
var esbuild_exports = {};
__export(esbuild_exports, {
  default: () => esbuild_default
});
module.exports = __toCommonJS(esbuild_exports);

// src/index.ts
var import_promises = require("fs/promises");
var import_jsdom = require("jsdom");
var import_mime_types = __toESM(require("mime-types"), 1);
var import_path = require("path");
var import_qiniu = __toESM(require("qiniu"), 1);
var ViteStaticCDN = (options) => {
  const { accessKey, secretKey, bucket } = options.qiniuConfig;
  const mac = new import_qiniu.default.auth.digest.Mac(accessKey, secretKey);
  const qiniuOptions = {
    scope: bucket,
    returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}'
  };
  const putPolicy = new import_qiniu.default.rs.PutPolicy(qiniuOptions);
  const uploadToken = putPolicy.uploadToken(mac);
  const config = new import_qiniu.default.conf.Config();
  const formUploader = new import_qiniu.default.form_up.FormUploader(config);
  const putExtra = new import_qiniu.default.form_up.PutExtra();
  const uploadSingleFile = async (localFilePath) => {
    const filename = (0, import_path.basename)(localFilePath);
    putExtra.mimeType = import_mime_types.default.lookup(filename) || "application/octet-stream";
    let key = (0, import_path.join)(options.basePath || "/", filename);
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
      const htmlPath = (0, import_path.resolve)(dir, "index.html");
      for (const path in bundle) {
        const file = bundle[path];
        if (file.fileName.endsWith(".html"))
          continue;
        switch (file.type) {
          case "asset":
          case "chunk":
            try {
              const localFilePath = (0, import_path.join)(dir, file.fileName);
              const cdn = await uploadSingleFile(localFilePath);
              assets.push({ source: file.fileName, cdn });
            } catch (error) {
              console.error(error);
              console.error(`\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\uFF1A${file.fileName}`);
            }
            break;
        }
      }
      const html = await (0, import_promises.readFile)(htmlPath, "utf-8");
      const dom = new import_jsdom.JSDOM(html);
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
      await (0, import_promises.writeFile)(htmlPath, newHtml, "utf-8");
    }
  };
};
var src_default = ViteStaticCDN;

// src/esbuild.ts
var esbuild_default = src_default;
exports.default = module.exports;