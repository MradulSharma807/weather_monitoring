##Project Overview
The Weather Monitoring System is a real-time application that aggregates and summarizes weather data. It provides users with daily weather summaries, alert thresholds for specific conditions, and visualizations to track historical weather trends.

##Features
Daily Weather Summary: Calculates average, maximum, and minimum temperatures, along with dominant weather conditions for each day.
User-Configurable Alerts: Allows users to set alert thresholds for weather conditions (e.g., temperature exceeding 35°C).
Data Visualizations: Displays daily weather summaries and historical trends to help users understand weather patterns.
Responsive UI: A user-friendly interface built with React.js for easy interaction.

Technology Stack Section
•	Language: JavaScript
•	Database: sqlite3
•	Backend Framework: Node.js (Express)
•	Frontend Framework: React.js
•	Tools: Postman for API testing


Installation
•	Clone the Repository:
  git clone https://github.com/MradulSharma807/weather_monitoring.git
  cd weather_monitoring

•	Install Dependencies: Navigate to both the backend and frontend directories and install the required packages.
   # For backend
   cd backend
   npm install cors axios sqlite3

   # For frontend
   cd ../frontend
   npm install


•	Set Up Environment Variables: Create a .env file in the backend directory and add your OpenWeatherMap API key:
  OPENWEATHER_API_KEY=your_api_key_here

•	Run the Application: Start the backend server:
   cd backend
   npm start
•	Start the frontend application in a new terminal:
   cd frontend
   npm start

License
This project is licensed under the MIT License. See the LICENSE file for details.

Acknowledgements
OpenWeatherMap for providing the weather data API.
React for a robust frontend framework.
