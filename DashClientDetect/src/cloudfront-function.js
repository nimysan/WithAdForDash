/**
 * CloudFront Function for Ad Insertion
 * 
 * This function intercepts DASH segment requests and conditionally redirects them
 * to ad content based on client IP and chunk number. It uses CloudFront KVS to
 * manage allowed IP addresses and ad configuration.
 */

import cf from 'cloudfront';

const kvsHandle = cf.kvs();

/**
 * Handles viewer requests to determine if ad content should be served
 * @param {Object} event - The CloudFront function event
 * @returns {Object} Modified or original request object
 */
async function handler(event) {
    // Extract request details
    const request = event.request;
    const uri = request.uri;
    const clientIP = event.viewer.ip;

    // Get allowed IPs from KVS
    const bad_client_ip_set = (await kvsHandle.get("bad_client_ip_set")) + "";
    const allowedIPs = bad_client_ip_set.split(",");

    // Parse URI to identify DASH segments
    const uriRegex = /\/TVD(\d+)\/.*chunk-stream(\d+)-(\d+)\.m4s/;
    const match = uri.match(uriRegex);
    console.log("[AD FETCH] Processing request for URI:", uri);

    // Check if request matches DASH pattern and IP is allowed
    if (match && allowedIPs.includes(clientIP)) {
        const streamId = match[2];
        const chunkNumber = match[3];

        // Insert ad content every 20th chunk
        if (Number(chunkNumber) % 20 === 0) {
            const originalPath = uri.replace('/TVD0002/', '/AD001/'); //关键是这里 
            console.log("[AD FETCH] Original path:", uri);
            request.uri = originalPath;
            console.log("[AD FETCH] Redirecting to ad content:", request.uri);

            return request;
        }
    }

    return request;
}
