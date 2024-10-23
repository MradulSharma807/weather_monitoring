// frontend/src/Weather.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Weather = () => {
    const [weatherData, setWeatherData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/weather');
                setWeatherData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching weather data:', error);
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Current Weather</h1>
            <table>
                <thead>
                    <tr>
                        <th>City</th>
                        <th>Temperature (°C)</th>
                        <th>Humidity (%)</th>
                        <th>Wind Speed (m/s)</th>
                        <th>Condition</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(weatherData).map(([city, data]) => (
                        <tr key={city}>
                            <td>{city}</td>
                            <td>{data.temperature}</td>
                            <td>{data.humidity}</td>
                            <td>{data.windSpeed}</td>
                            <td>{data.condition}</td>
                            <td>{data.timestamp.toString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Weather;
