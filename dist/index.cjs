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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_promises = require("fs/promises");
var import_jsdom = require("jsdom");
var import_mime_types = __toESM(require("mime-types"), 1);
var import_path = require("path");
var import_qiniu = __toESM(require("qiniu"), 1);
var ViteStaticCDN = (options) => {
  const uploadToQiniu = (props) => {
    const { localFilePath, filename, mimeType } = props;
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
    putExtra.mimeType = mimeType;
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
  const uploadSingleFile = async (localFilePath) => {
    const filename = (0, import_path.basename)(localFilePath);
    const mimeType = import_mime_types.default.lookup(filename) || "application/octet-stream";
    return options.qiniuConfig ? uploadToQiniu({ localFilePath, filename, mimeType }) : options.customUpload({ localFilePath, filename, mimeType });
  };
  return {
    name: "vite-static-cdn",
    async writeBundle({ dir }, bundle) {
      if (!options.qiniuConfig && !options.customUpload)
        throw new Error("\u8BF7\u914D\u7F6E\u4E0A\u4F20\u65B9\u6CD5\uFF01");
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
exports.default = module.exports;