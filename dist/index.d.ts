import { Plugin } from 'rollup';
import { Options } from './types.js';

/**
 * 把打包后的静态资源自动上传到CDN
 * @param {Options} options 插件配置
 * @returns {Plugin}
 */
declare const ViteStaticCDN: (options: Options) => Plugin;

export { ViteStaticCDN as default };
