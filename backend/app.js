require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cron = require('node-cron');
const axios = require('axios');
const moment = require('moment-timezone');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
                 request_url, response_code, response_headers, response_body, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    cdnServer.id, 
                    channel.id, 
                    isValid,
                    responseTime,
                    isValid ? null : 'Invalid M3U8 format',
                    url,
                    response.status,
                    JSON.stringify(response.headers),
                    response.data.substring(0, 1000),
                    moment().tz('Asia/Jakarta').toISOString()
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
                 request_url, response_code, response_headers, response_body, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    cdnServer.id,
                    channel.id,
                    false,
                    responseTime,
                    errorMessage,
                    url,
                    error.response?.status || 0,
                    JSON.stringify(error.response?.headers || {}),
                    error.response?.data || error.message,
                    moment().tz('Asia/Jakarta').toISOString()
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

// Enhanced monitoring status endpoint with pagination and search
app.get('/monitoring/status', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Search parameters
        const search = {
            name_cdn: req.query.name_cdn || '',
            ip_cdn: req.query.ip_cdn || '',
            name_channel: req.query.name_channel || ''
        };

        // Build search conditions
        const searchConditions = [];
        const searchParams = [];
        let paramCount = 1;

        if (search.name_cdn) {
            searchConditions.push(`LOWER(s.name_cdn) LIKE LOWER($${paramCount})`);
            searchParams.push(`%${search.name_cdn}%`);
            paramCount++;
        }
        if (search.ip_cdn) {
            searchConditions.push(`LOWER(s.ip_cdn) LIKE LOWER($${paramCount})`);
            searchParams.push(`%${search.ip_cdn}%`);
            paramCount++;
        }
        if (search.name_channel) {
            searchConditions.push(`LOWER(c.name_channel) LIKE LOWER($${paramCount})`);
            searchParams.push(`%${search.name_channel}%`);
            paramCount++;
        }

        const whereClause = searchConditions.length 
            ? 'WHERE ' + searchConditions.join(' AND ')
            : '';

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) 
            FROM ott_cdn_servers s
            CROSS JOIN ott_preview_channels c
            ${whereClause}
        `;
        
        const countResult = await pool.query(countQuery, searchParams);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // Main query with LATERAL join to get latest monitoring data
        const mainQuery = `
            SELECT 
                m.id,
                s.name_cdn,
                s.ip_cdn,
                c.name_channel,
                m.status,
                m.response_time,
                m.error_message,
                m.created_at AS update_at
            FROM ott_cdn_servers s
            CROSS JOIN ott_preview_channels c
            LEFT JOIN LATERAL (
                SELECT 
                    id,
                    status,
                    response_time,
                    error_message,
                    created_at
                FROM ott_monitoring_logs m2
                WHERE m2.cdn_server_id = s.id
                AND m2.channel_id = c.id
                ORDER BY created_at DESC
                LIMIT 1
            ) m ON true
            ${whereClause}
            ORDER BY 
                COALESCE(m.status, false) ASC,
                m.created_at ASC
            LIMIT $${paramCount}
            OFFSET $${paramCount + 1}
        `;

        // Add pagination parameters
        const queryParams = [...searchParams, limit, offset];
        const result = await pool.query(mainQuery, queryParams);

        // Format the response data
        const formattedResults = result.rows.map(row => ({
            ...row,
            update_at: row.update_at ? moment(row.update_at).format('YYYY-MM-DD HH:mm:ss.SSS Z') : null
        }));
        
        // Prepare pagination metadata
        const pagination = {
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };

        // Return formatted response
        res.json({
            status: "success",
            message: "Data retrieved successfully",
            pagination: pagination,
            search: search,
            data: formattedResults
        });

    } catch (error) {
        console.error('Error in /monitoring/status:', error);
        res.status(500).json({
            status: "error",
            message: error.message,
            data: null
        });
    }
});

// Monitoring detail endpoint
app.get('/monitoring/status/detail/:id', async (req, res) => {
    try {
        const logId = req.params.id;

        const query = `
            SELECT 
                s.name_cdn,
                s.ip_cdn,
                c.name_channel,
                m.status,
                m.response_time,
                m.error_message,
                m.request_url,
                m.response_body,
                m.created_at AS update_at
            FROM ott_monitoring_logs m
            JOIN ott_cdn_servers s ON s.id = m.cdn_server_id
            JOIN ott_preview_channels c ON c.id = m.channel_id
            WHERE m.id = $1
        `;

        const result = await pool.query(query, [logId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Monitoring log not found",
                data: null
            });
        }

        // Format the timestamp
        const formattedResult = {
            ...result.rows[0],
            update_at: moment(result.rows[0].update_at).format('YYYY-MM-DD HH:mm:ss.SSS Z')
        };

        res.json({
            status: "success",
            message: "Data retrieved successfully",
            data: formattedResult
        });

    } catch (error) {
        console.error('Error in /monitoring/detail/:id:', error);
        res.status(500).json({
            status: "error",
            message: error.message,
            data: null
        });
    }
});

// Schedule monitoring job
cron.schedule(process.env.MONITORING_INTERVAL, () => {
    console.log('Starting monitoring job at:', moment().tz('Asia/Jakarta').format());
    runMonitoring();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: "error",
        message: "Internal server error",
        data: null
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Run initial monitoring
    runMonitoring();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end();
    });
});