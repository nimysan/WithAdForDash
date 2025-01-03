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
 * Lambda@Edge ViewerResponse事件处理函数
 * @param {Object} event - CloudFront事件对象
 * @returns {Object} - 修改后的响应对象
 */
export const handleOriginResponse = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;
  
  try {
    console.log("[ORIGIN RESPONSE] Original response:", JSON.stringify(response, null, 2));
    
    // Return the response unmodified
    return response;
    
  } catch (error) {
    console.error('[ERROR] Origin response handler failed:', error);
    console.error('[ERROR] Error details:', {
      message: error.message,
      stack: error.stack
    });
    return response;
  }
};

export const handleViewerRequest = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const response = event.Records[0].cf.response;
  const uri = request.uri;

  try {
    console.log("[RESPONSE] Original response:", JSON.stringify(response, null, 2));
    console.log("[CONFIG] Processing response for URI:", uri);

    // 检查是否是MPD文件
    if (uri.endsWith('.mpd')) {
      callback(null, request);
      return;
    }

    // 硬编码配置值
    const bad_client_ip_set = '1.2.3.4,54.240.199.97,18.140.246.140';
    let ad_content_url = 'https://dash.plaza.red/AD001';

    // console.log("[IP CHECK] Client IP:", clientIP);
    console.log("[IP CHECK] Allowed IPs:", bad_client_ip_set);

    const allowedIPs = bad_client_ip_set.split(",");

    // 使用正则表达式提取流ID和分片序号
    const uriRegex = /\/TVD(\d+)\/.*chunk-stream(\d+)-(\d+)\.m4s/;
    const match = uri.match(uriRegex);

    if (match) {
      console.log("[URI MATCH] Found DASH segment pattern in URI");
      console.log("[URI MATCH] Full match:", match[0]);
      console.log("[URI MATCH] TVD ID:", match[1]);
      const streamId = match[2];
      const chunkNumber = match[3];
      console.log("[STREAM INFO] Stream ID:", streamId);
      console.log("[STREAM INFO] Chunk Number:", chunkNumber);

      // if (!allowedIPs.includes(clientIP)) {
      //   console.log("[IP CHECK] Client IP not in allowed list, passing through original request");
      //   return response;
      // }

      if (Number(chunkNumber) % 5 === 0) {
        // 获取广告内容
        ad_content_url = "/AD001/" + streamId + "-1.m4s?seq="+chunkNumber;
        console.log("[AD FETCH] Attempting to fetch ad content from:", ad_content_url);

        request.uri = ad_content_url;
        callback(null, request);
        return;
      }
    }
    // 如果不需要替换，返回原始请求
    callback(null, request);

  } catch (error) {
    console.error('[ERROR] Viewer request handler failed:', error);
    console.error('[ERROR] Error details:', {
      message: error.message,
      stack: error.stack,
      requestUri: uri,
      clientIP: clientIP
    });
    callback(null, request);
  }
};
