/**
 * Weather API module for OpenWeather One Call 3.0
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

export const RESORTS = [
    { name: 'Northstar', lat: 39.2746, lon: -120.1211 },
    { name: 'Heavenly', lat: 38.9353, lon: -119.9400 },
    { name: 'Kirkwood', lat: 38.6845, lon: -120.0655 },
    { name: 'Sugar Mountain', lat: 36.1298, lon: -81.8565 },
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
