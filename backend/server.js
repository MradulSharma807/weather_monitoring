// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 5000;

// OpenWeather API configuration
const API_KEY = process.env.OPENWEATHER_API_KEY; // Use environment variable for security
const CITIES = ['Delhi', 'Mumbai', 'Chennai', 'Bengaluru', 'Kolkata', 'Hyderabad'];
const UPDATE_INTERVAL = 300000; // 5 minutes

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./weather_data.db', (err) => {
    if (err) {
        console.error('Database opening error: ', err);
    }
});

// Create table for daily weather summary and alerts
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS daily_weather_summary (
        date TEXT,
        average_temp REAL,
        max_temp REAL,
        min_temp REAL,
        dominant_condition TEXT,
        average_humidity REAL,
        average_wind_speed REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT,
        condition TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Fetch weather data and process it
const fetchWeatherData = async () => {
    try {
        const weatherData = await Promise.all(
            CITIES.map(async (city) => {
                const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
                return {
                    city,
                    temperature: response.data.main.temp,
                    humidity: response.data.main.humidity,
                    windSpeed: response.data.wind.speed,
                    condition: response.data.weather[0].main,
                    timestamp: new Date(),
                };
            })
        );

        processWeatherData(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
};

// Process fetched weather data and calculate daily aggregates
// const processWeatherData = (weatherData) => {
//     const now = new Date();
//     const dateString = now.toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

//     // Check if summary for today already exists
//     db.get(`SELECT * FROM daily_weather_summary WHERE date = ?`, [dateString], (err, row) => {
//         if (err) {
//             console.error('Error checking existing summary:', err);
//             return;
//         }

//         if (!row) { // Only create a new summary if one doesn't exist
//             const dailySummary = {
//                 date: dateString,
//                 average_temp: 0,
//                 max_temp: -Infinity,
//                 min_temp: Infinity,
//                 dominant_condition: '',
//                 average_humidity: 0,
//                 average_wind_speed: 0,
//             };

//             weatherData.forEach((data) => {
//                 dailySummary.average_temp += data.temperature;
//                 dailySummary.average_humidity += data.humidity;
//                 dailySummary.average_wind_speed += data.windSpeed;

//                 if (data.temperature > dailySummary.max_temp) {
//                     dailySummary.max_temp = data.temperature;
//                 }

//                 if (data.temperature < dailySummary.min_temp) {
//                     dailySummary.min_temp = data.temperature;
//                 }

//                 dailySummary.dominant_condition = dailySummary.dominant_condition || data.condition; // Set the first condition as dominant
//             });

//             dailySummary.average_temp /= weatherData.length;
//             dailySummary.average_humidity /= weatherData.length;
//             dailySummary.average_wind_speed /= weatherData.length;

//             // Store daily summary in the database
//             storeDailySummary(dailySummary);
//         } else {
//             console.log(`Summary for ${dateString} already exists, skipping...`);
//         }
//     });
// };

const getDominantCondition = (weatherData) => {
    const conditionCount = {};
    weatherData.forEach(data => {
        conditionCount[data.condition] = (conditionCount[data.condition] || 0) + 1;
    });

    return Object.keys(conditionCount).reduce((a, b) => conditionCount[a] > conditionCount[b] ? a : b);
};

const processWeatherData = (weatherData) => {
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];

    db.get(`SELECT * FROM daily_weather_summary WHERE date = ?`, [dateString], (err, row) => {
        if (err) {
            console.error('Error checking existing summary:', err);
            return;
        }

        if (!row) {
            const dailySummary = {
                date: dateString,
                average_temp: 0,
                max_temp: -Infinity,
                min_temp: Infinity,
                dominant_condition: '',
                average_humidity: 0,
                average_wind_speed: 0,
            };

            weatherData.forEach((data) => {
                dailySummary.average_temp += data.temperature;
                dailySummary.average_humidity += data.humidity;
                dailySummary.average_wind_speed += data.windSpeed;

                if (data.temperature > dailySummary.max_temp) {
                    dailySummary.max_temp = data.temperature;
                }

                if (data.temperature < dailySummary.min_temp) {
                    dailySummary.min_temp = data.temperature;
                }
            });

            dailySummary.dominant_condition = getDominantCondition(weatherData);
            dailySummary.average_temp /= weatherData.length;
            dailySummary.average_humidity /= weatherData.length;
            dailySummary.average_wind_speed /= weatherData.length;

            storeDailySummary(dailySummary);
        } else {
            console.log(`Summary for ${dateString} already exists, skipping...`);
        }
    });
};
// Store daily summary in the database
const storeDailySummary = (summary) => {
    db.run(`INSERT INTO daily_weather_summary (date, average_temp, max_temp, min_temp, dominant_condition, average_humidity, average_wind_speed) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [summary.date, summary.average_temp, summary.max_temp, summary.min_temp, summary.dominant_condition, summary.average_humidity, summary.average_wind_speed],
        (err) => {
            if (err) {
                console.error('Error inserting daily summary:', err);
            }
        }
    );
};

// Check alerts based on temperature thresholds
let breachCount = 0;

const checkAlerts = (weatherData) => {
    const TEMP_THRESHOLD = 35;

    weatherData.forEach((data) => {
        if (data.temperature > TEMP_THRESHOLD) {
            breachCount += 1;

            if (breachCount >= 2) {
                const alertMessage = `Alert: ${data.city} temperature exceeds ${TEMP_THRESHOLD}°C for two consecutive updates!`;
                console.log(alertMessage);
                sendAlertEmail(data.city, alertMessage);
                // Store alert in DB
                db.run(`INSERT INTO alerts (city, condition) VALUES (?, ?)`, [data.city, alertMessage], (err) => {
                    if (err) {
                        console.error('Error inserting alert:', err);
                    }
                });
            }
        } else {
            breachCount = 0; // Reset if temperature drops
        }
    });
};



// Start periodic weather data fetching
setInterval(fetchWeatherData, UPDATE_INTERVAL);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    fetchWeatherData(); // Initial fetch
});

// Endpoint to get current weather data for frontend
app.get('/weather', async (req, res) => {
    try {
        const weatherData = await Promise.all(CITIES.map(city =>
            axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
        ));

        const results = weatherData.map(response => {
            const data = response.data;
            return {
                city: data.name,
                temperature: data.main.temp,
                humidity: data.main.humidity,
                windSpeed: data.wind.speed,
                condition: data.weather[0].main,
                timestamp: new Date().toISOString()
            };
        });

        res.json(results);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        res.status(500).send("Error fetching weather data.");
    }
});


// Endpoint to fetch daily weather summaries for frontend
app.get('/daily-summaries', (req, res) => {
    db.all(`SELECT * FROM daily_weather_summary`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});



