import cf from 'cloudfront';

const kvsHandle = cf.kvs();

async function handler(event) {
    const request = event.request;
    const uri = event.request.uri;
    const headers = request.headers;
    const clientIP = event.viewer.ip;
    const bad_client_ip_set = (await kvsHandle.get("bad_client_ip_set")) + "";
    const allowedIPs = bad_client_ip_set.split(",");

    const adContent = await kvsHandle.get("ad_host"); // 获取存储在KVS中的m4s文件内容

    const uriRegex = /\/TVD(\d+)\/.*chunk-stream(\d+)-(\d+)\.m4s/;
    const match = uri.match(uriRegex);
    console.log("[AD FETCH] Attempting to fetch ad content fro-----><"+match);

    if (match && allowedIPs.includes(clientIP)) {
        const streamId = match[2];
        const chunkNumber = match[3];

        if (Number(chunkNumber) % 20 === 0) {
            const originalPath = uri.replace('/TVD0002/', '/AD001/');
             console.log("[AD FETCH] crest --》"+uri);
            request.uri = originalPath;
            console.log("[AD FETCH] redirect content to---》"+request.uri);

            return request;
        }
    }

    return request;
}