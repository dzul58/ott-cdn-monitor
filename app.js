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

// Function to check if monitoring record exists
async function getExistingMonitoring(cdnServerId, channelId) {
    const result = await pool.query(
        `SELECT id FROM ott_monitoring_logs 
         WHERE cdn_server_id = $1 AND channel_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [cdnServerId, channelId]
    );
    return result.rows[0];
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

        // Check if monitoring record exists
        const existingRecord = await getExistingMonitoring(cdnServer.id, channel.id);

        if (existingRecord) {
            // Update existing record
            await pool.query(
                `UPDATE ott_monitoring_logs 
                 SET status = $1,
                     response_time = $2,
                     error_message = $3,
                     request_url = $4,
                     response_code = $5,
                     response_headers = $6,
                     response_body = $7,
                     created_at = $8
                 WHERE id = $9`,
                [
                    isValid,
                    responseTime,
                    isValid ? null : 'Invalid M3U8 format',
                    url,
                    response.status,
                    JSON.stringify(response.headers),
                    response.data.substring(0, 1000),
                    moment().tz('Asia/Jakarta').toISOString(),
                    existingRecord.id
                ]
            );
        } else {
            // Insert new record
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
                    response.data.substring(0, 1000)
                ]
            );
        }

    } catch (error) {
        const responseTime = getJakartaTimestamp() - startTime;
        const errorMessage = error.message;

        // Check if monitoring record exists
        const existingRecord = await getExistingMonitoring(cdnServer.id, channel.id);

        if (existingRecord) {
            // Update existing record
            await pool.query(
                `UPDATE ott_monitoring_logs 
                 SET status = $1,
                     response_time = $2,
                     error_message = $3,
                     request_url = $4,
                     response_code = $5,
                     response_headers = $6,
                     response_body = $7,
                     created_at = $8
                 WHERE id = $9`,
                [
                    false,
                    responseTime,
                    errorMessage,
                    url,
                    error.response?.status || 0,
                    JSON.stringify(error.response?.headers || {}),
                    error.response?.data || error.message,
                    moment().tz('Asia/Jakarta').toISOString(),
                    existingRecord.id
                ]
            );
        } else {
            // Insert new record
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

// API endpoint to get latest monitoring results
app.get('/monitoring/status', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.name_cdn,
                s.ip_cdn,
                c.name_channel,
                m.status,
                m.response_time,
                m.error_message,
                m.created_at as checked_at
            FROM ott_cdn_servers s
            CROSS JOIN ott_preview_channels c
            LEFT JOIN ott_monitoring_logs m ON 
                m.cdn_server_id = s.id AND 
                m.channel_id = c.id
            ORDER BY s.name_cdn, c.name_channel
        `);
        
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Schedule monitoring job
cron.schedule(process.env.MONITORING_INTERVAL, () => {
    console.log('Starting monitoring job at:', moment().tz('Asia/Jakarta').format());
    runMonitoring();
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Run initial monitoring
    runMonitoring();
});