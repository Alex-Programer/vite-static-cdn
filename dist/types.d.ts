interface UploadProps {
    localFilePath: string;
    filename: string;
    mimeType: string;
}
interface Options {
    /** 七牛云的空间域名 */
    host?: string;
    /** 文件上传到七牛云上的路径前缀，最后资源的访问路径为：host + basePath + 文件名 */
    basePath?: string;
    qiniuConfig?: {
        accessKey: string;
        secretKey: string;
        bucket: string;
    };
    /**
     * 自定义上传方法，返回值为上传后的资源链接
     */
    customUpload?: (props: UploadProps) => Promise<string>;
}

export { Options, UploadProps };
