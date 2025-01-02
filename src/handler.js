'use strict';

import fetch from 'node-fetch';

/**
 * Lambda@Edge ViewerRequest事件处理函数
 * @param {Object} event - CloudFront事件对象
 * @returns {Object} - 修改后的请求或响应对象
 */
export const handleViewerRequest = async (event) => {
  const request = event.Records[0].cf.request;
  const clientIP = request.clientIp;
  const uri = request.uri;
  
  try {
    console.log("request " + JSON.stringify(request));
    
    // 从环境变量获取配置
    const bad_client_ip_set = process.env.BAD_CLIENT_IP_SET || '';
    const ad_content_url = process.env.AD_CONTENT_URL || '';
    
    console.log("clientIP " + clientIP);
    console.log("bad_client_ip_set: " + bad_client_ip_set);
    
    const allowedIPs = bad_client_ip_set.split(",");
    
    // 使用正则表达式提取流ID和分片序号
    const uriRegex = /\/TVD(\d+)\/.*chunk-stream(\d+)-(\d+)\.m4s/;
    const match = uri.match(uriRegex);
    
    if (match && allowedIPs.includes(clientIP)) {
      const streamId = match[2];
      const chunkNumber = match[3];
      console.log("Stream ID:" + streamId);
      console.log("Chunk Number:" + chunkNumber);
      
      if (Number(chunkNumber) % 20 === 0) {
        try {
          // 获取广告内容
          const response = await fetch(ad_content_url);
          const adContent = await response.arrayBuffer();
          
          // 返回广告内容
          return {
            status: '200',
            statusDescription: 'OK',
            headers: {
              'content-type': [{
                key: 'Content-Type',
                value: 'video/mp4'
              }],
              'content-length': [{
                key: 'Content-Length',
                value: adContent.byteLength.toString()
              }]
            },
            body: adContent.toString('base64'),
            bodyEncoding: 'base64'
          };
        } catch (error) {
          console.error('Error fetching ad content:', error);
          return request;
        }
      }
    }
    
    // 如果不需要替换，返回原始请求
    return request;
    
  } catch (error) {
    console.error('Error in viewer request handler:', error);
    return request; // 发生错误时返回原始请求
  }
};
