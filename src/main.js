import './style.css';
import { fetchWeatherData, RESORTS } from './api/weatherApi';
import { evaluateMood, MOODS } from './logic/moodEngine';

let currentResort = RESORTS[0];
let weatherData = null;
let selectedOffset = 0; // 0 = Today, 1 = Tomorrow, etc.

const resortSidebar = document.getElementById('resort-sidebar');
const moodSummary = document.getElementById('mood-summary');
const moodVisual = document.getElementById('mood-visual');
const hourlyForecast = document.getElementById('hourly-forecast');
const snowChart = document.getElementById('snow-chart');
const headerNav = document.querySelector('.header-nav');

// Mood Configuration
const MOOD_CONFIG = {
  [MOODS.JUMPING]: { text: 'Fresh powder. Very good to ride.', gif: 'jumping.gif' },
  [MOODS.CARVING]: { text: 'Smooth groomers. Enjoy the carve.', gif: 'carving.gif' },
  [MOODS.SITTING]: { text: 'Getting heavy. Check that base.', gif: 'sitting.gif' },
  [MOODS.SAD_WALK]: { text: 'Slush alert. Better days ahead.', gif: 'sad_walk.gif' }
};

/**
 * Initialize the app
 */
async function init() {
  renderSidebar();
  await loadResort(RESORTS[0]);
}

/**
 * Render the resort sidebar
 */
function renderSidebar() {
  resortSidebar.innerHTML = RESORTS.map(resort => `
    <div class="resort-item ${resort.name === currentResort.name ? 'active' : ''}" 
         onclick="window.loadResortByName('${resort.name}')">
      ${resort.name}
    </div>
  `).join('');
}

/**
 * Load data for a specific resort
 */
window.loadResortByName = (name) => {
  const resort = RESORTS.find(r => r.name === name);
  if (resort) loadResort(resort);
};

async function loadResort(resort) {
  currentResort = resort;
  moodSummary.innerText = 'Loading...';
  renderSidebar();
  weatherData = await fetchWeatherData(resort.lat, resort.lon);
  if (weatherData) {
    updateUI();
  } else {
    moodSummary.innerText = 'Error loading weather data.';
  }
}

window.selectDate = (offset) => {
  selectedOffset = offset;
  updateUI();
};

/**
 * Update the main UI with weather data
 */
function updateUI() {
  renderHeaderNav();

  // For simplicity, we use the average of the selected day's forecast for the mood
  // In a real app, we might want to re-evaluate mood for Tomorrow specifically
  const mood = evaluateMood(weatherData);
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG[MOODS.CARVING];

  // Update Summary and Visual
  moodSummary.innerText = config.text;
  moodVisual.innerHTML = `<img src="/assets/${config.gif}" alt="${mood}" class="mood-img" onerror="this.src='https://placehold.co/400x300?text=${mood}'">`;

  // Update Hourly Forecast
  renderHourlyForecast();

  // Update Snow Chart
  renderSnowChart();
}

function renderHeaderNav() {
  const today = new Date();
  const offsets = [-1, 0, 1]; // Yesterday, Today, Tomorrow

  headerNav.innerHTML = offsets.map(offset => {
    const date = new Date();
    date.setDate(today.getDate() + offset);

    let label = '';
    if (offset === 0) label = 'Today';
    else if (offset === -1) label = 'Yesterday';
    else if (offset === 1) label = 'Tomorrow';

    // If selected, show date format except for Today
    if (selectedOffset === offset && offset !== 0) {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return `
      <span class="nav-link ${selectedOffset === offset ? 'active' : ''}" 
            onclick="window.selectDate(${offset})">
        ${label}
      </span>
    `;
  }).join('');
}

function renderHourlyForecast() {
  // If Tomorrow is selected, show forecast starting from 24h ahead
  const startIdx = selectedOffset === 1 ? 24 : 0;
  const hours = weatherData.hourly.slice(startIdx, startIdx + 12);

  hourlyForecast.innerHTML = hours.map(h => {
    const d = new Date(h.dt * 1000);
    const time = d.getHours();
    const temp = Math.round(h.temp);
    const pop = Math.round(h.pop * 100);
    const icon = h.weather[0].icon;

    return `
      <div class="weather-hour">
        <span>${time}:00</span>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather">
        ${pop > 10 ? `<span class="pop">${pop}%</span>` : ''}
        <span>${temp}°</span>
      </div>
    `;
  }).join('');
}

function renderSnowChart() {
  const days = weatherData.daily.slice(0, 7); // Next 7 days
  const mmToInches = 0.0393701;

  snowChart.innerHTML = days.map(d => {
    const snowMM = d.snow || 0;
    const snowInches = (snowMM * mmToInches).toFixed(2);
    const height = Math.min(snowMM * 10, 150); // Scale height based on mm for visual impact

    return `
      <div class="bar" style="height: ${height}px" title="${snowInches} in">
        <span style="position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 14px; color: #666;">
          ${snowInches}"
        </span>
      </div>
    `;
  }).join('');
}

init();
