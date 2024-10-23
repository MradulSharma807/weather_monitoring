import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { Line } from 'react-chartjs-2';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);


function App() {
  const [weatherData, setWeatherData] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeatherData();
    fetchDailySummaries();
  }, []);

  const fetchWeatherData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/weather');
      setWeatherData(response.data); // Store fetched data in state
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData([{ error: 'Failed to load weather data.' }]); // Set error in state
    }
  };

  const fetchDailySummaries = async () => {
    try {
      const response = await axios.get('http://localhost:5000/daily-summaries');
      setDailySummaries(response.data);
    } catch (error) {
      console.error('Error fetching daily summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: dailySummaries.map(summary =>
      new Date(summary.date).toLocaleDateString("en-US", {
        day: 'numeric',
        month: 'short'
      }) // Format the date
    ),
    // labels: dailySummaries.map(summary => summary.date),
    datasets: [
      {
        label: 'Average Temperature (°C)',
        data: dailySummaries.map(summary => summary.average_temp),
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 3,  // Increased width
        fill: false,
      },
      {
        label: 'Max Temperature (°C)',
        data: dailySummaries.map(summary => summary.max_temp),
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 3,  // Increased width
        fill: false,
      },
      {
        label: 'Min Temperature (°C)',
        data: dailySummaries.map(summary => summary.min_temp),
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 3,  // Increased width
        fill: false,
      },
    ],
  };
  console.log(dailySummaries); // To verify the data format


  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top', // Ensure it's at the top of the chart
        labels: {
          color: '#000',  // Make sure the labels are in a visible color (black)
          font: {
            size: 14,     // Increase the font size for better visibility
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#000',
        },
        ticks: {
          color: '#000',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#000',
        },
        ticks: {
          color: '#000',
        },
      },
    },
  };

  console.log(chartData.datasets);
  return (
    <div className="App">
      <h1>Current Weather</h1>
      {weatherData.error ? (
        <p>{weatherData.error}</p>
      ) : (
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
            {weatherData.map((data) => (
              <tr key={data.city}>
                <td>{data.city}</td>
                <td>{data.temperature}</td>
                <td>{data.humidity}</td>
                <td>{data.windSpeed}</td>
                <td>{data.condition}</td>
                <td>{new Date(data.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Daily Weather Summaries</h2>
      {loading ? (
        <p>Loading daily summaries...</p>
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  );
}

export default App;
