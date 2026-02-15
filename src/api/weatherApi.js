/**
 * Weather API module for OpenWeather One Call 3.0
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

export const RESORTS = [
    { name: 'Heavenly', region: 'California', lat: 38.9353, lon: -119.9400 },
    { name: 'Northstar', region: 'California', lat: 39.2746, lon: -120.1211 },
    { name: 'Kirkwood', region: 'California', lat: 38.6845, lon: -120.0655 },
    { name: 'Park City Mountain', region: 'Utah', lat: 40.6461, lon: -111.4980 },
    { name: 'Vail', region: 'Colorado', lat: 39.6403, lon: -106.3742 },
    { name: 'Beaver Creek', region: 'Colorado', lat: 39.6050, lon: -106.5165 },
    { name: 'Breckenridge', region: 'Colorado', lat: 39.4817, lon: -106.0384 },
    { name: 'Keystone', region: 'Colorado', lat: 39.6051, lon: -105.9531 },
    { name: 'Stevens Pass', region: 'Washington', lat: 47.7463, lon: -121.0858 },
];

/**
 * Fetch weather data for a specific resort
 * @param {number} lat 
 * @param {number} lon 
 * @returns {Promise<Object>}
 */
export async function fetchWeatherData(lat, lon) {
    if (!API_KEY) {
        console.error('Missing OpenWeather API Key. Please add VITE_OPENWEATHER_API_KEY to your .env file.');
        return null;
    }

    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    try {
        const response = await fetch(url, { referrerPolicy: 'no-referrer' });
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        return null;
    }
}
