'use strict';

import fetch from 'node-fetch';

/**
 * 将ArrayBuffer转换为Base64字符串
 * @param {ArrayBuffer} buffer - 要转换的ArrayBuffer
 * @returns {string} - Base64字符串
 */
function arrayBufferToBase64(buffer) {
  const uint8Array = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

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
    
    // 硬编码配置值
    const bad_client_ip_set = '1.2.3.4,54.240.199.97';
    let ad_content_url = 'https://dash.plaza.red/AD001';
    
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
          ad_content_url = "https://dash.plaza.red/AD001/"+streamId+"-1.m4s";
          const response = await fetch(ad_content_url);
          const adContent = await response.arrayBuffer();
          const base64Content = arrayBufferToBase64(adContent);
          
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
            body: base64Content,
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
