require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');

const app = express();
const port = 3000;

// Database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Function to get current timestamp in Jakarta timezone
function getJakartaTimestamp() {
    return moment().tz('Asia/Jakarta').valueOf();
}

// Function to check CDN status
async function checkCdnStatus(cdnServer, channel) {
    const startTime = getJakartaTimestamp();
    const url = `http://${cdnServer.ip_cdn}:6543/${channel.link_preview}`;
    
    try {
        const response = await axios.get(url, {
            timeout: 5000, // 5 seconds timeout
            validateStatus: null // Allow all HTTP status codes
        });
        
        const responseTime = getJakartaTimestamp() - startTime;
        const isValid = response.status === 200 && response.data.includes('#EXTM3U');

        // Insert monitoring result and log
        await pool.query(
            `INSERT INTO ott_monitoring_logs 
            (cdn_server_id, channel_id, status, response_time, error_message, 
             request_url, response_code, response_headers, response_body) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                cdnServer.id, 
                channel.id, 
                isValid,
                responseTime,
                isValid ? null : 'Invalid M3U8 format',
                url,
                response.status,
                JSON.stringify(response.headers),
                response.data.substring(0, 1000) // Store first 1000 characters of response
            ]
        );

    } catch (error) {
        const responseTime = getJakartaTimestamp() - startTime;
        const errorMessage = error.message;

        // Insert error log
        await pool.query(
            `INSERT INTO ott_monitoring_logs 
            (cdn_server_id, channel_id, status, response_time, error_message, 
             request_url, response_code, response_headers, response_body) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                cdnServer.id,
                channel.id,
                false,
                responseTime,
                errorMessage,
                url,
                error.response?.status || 0,
                JSON.stringify(error.response?.headers || {}),
                error.response?.data || error.message
            ]
        );
    }
}

// Function to run monitoring
async function runMonitoring() {
    try {
        // Get all CDN servers
        const cdnServers = await pool.query('SELECT * FROM ott_cdn_servers');
        
        // Get all preview channels
        const channels = await pool.query('SELECT * FROM ott_preview_channels');
        
        // Check each combination of CDN and channel
        for (const cdn of cdnServers.rows) {
            for (const channel of channels.rows) {
                await checkCdnStatus(cdn, channel);
            }
        }
        
        console.log('Monitoring completed at:', moment().tz('Asia/Jakarta').format());
    } catch (error) {
        console.error('Error in monitoring:', error);
    }
}

// Schedule monitoring job
cron.schedule(process.env.MONITORING_INTERVAL, () => {
    console.log('Starting monitoring job at:', moment().tz('Asia/Jakarta').format());
    runMonitoring();
});

// // API endpoint to get latest monitoring results
// app.get('/monitoring/status', async (req, res) => {
//     try {
//         const result = await pool.query(`
//             SELECT 
//                 s.name_cdn,
//                 s.ip_cdn,
//                 c.name_channel,
//                 m.status,
//                 m.response_time,
//                 m.error_message,
//                 m.created_at as checked_at
//             FROM ott_cdn_servers s
//             CROSS JOIN ott_preview_channels c
//             LEFT JOIN LATERAL (
//                 SELECT 
//                     status, 
//                     response_time, 
//                     error_message, 
//                     created_at
//                 FROM ott_monitoring_logs m2
//                 WHERE m2.cdn_server_id = s.id 
//                 AND m2.channel_id = c.id
//                 ORDER BY created_at DESC
//                 LIMIT 1
//             ) m ON true
//             ORDER BY s.name_cdn, c.name_channel
//         `);
        
//         res.json(result.rows);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Run initial monitoring
    runMonitoring();
});