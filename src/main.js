import './style.css';
import { fetchWeatherData, RESORTS } from './api/weatherApi';
import { evaluateMood, MOODS } from './logic/moodEngine';

let currentResort = RESORTS[0];
let weatherData = null;
let selectedOffset = 0; // 0 = Today, 1 = Tomorrow, etc.
let searchQuery = '';

const resortSidebarContent = document.getElementById('resort-sidebar-content');
const resortSearch = document.getElementById('resort-search');
const moodSummary = document.getElementById('mood-summary');
const moodVisual = document.getElementById('mood-visual');
const fullForecast = document.getElementById('full-forecast');
const datePicker = document.getElementById('date-picker');

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
  setupEventListeners();
  renderSidebar();
  await loadResort(RESORTS[0]);
}

function setupEventListeners() {
  resortSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderSidebar();
  });
}

/**
 * Render the resort sidebar with grouping and search
 */
function renderSidebar() {
  const filteredResorts = RESORTS.filter(r =>
    r.name.toLowerCase().includes(searchQuery) ||
    r.region.toLowerCase().includes(searchQuery)
  );

  const regions = [...new Set(filteredResorts.map(r => r.region))];

  resortSidebarContent.innerHTML = regions.map(region => `
        <div class="region-group">
            <h2 class="region-title">${region}</h2>
            ${filteredResorts
      .filter(r => r.region === region)
      .map(resort => `
                    <div class="resort-item ${resort.name === currentResort.name ? 'active' : ''}" 
                         onclick="window.loadResortByName('${resort.name}')">
                        ${resort.name}
                    </div>
                `).join('')}
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
  renderDatePicker();

  // Evaluate mood based on selected day's data if available, else overall
  const mood = evaluateMood(weatherData);
  const config = MOOD_CONFIG[mood] || MOOD_CONFIG[MOODS.CARVING];

  // Update Summary and Visual
  moodSummary.innerText = config.text;
  moodVisual.innerHTML = `<img src="/assets/${config.gif}" alt="${mood}" class="mood-img" onerror="this.src='https://placehold.co/400x300?text=${mood}'">`;

  // Update Combined Forecast
  renderFullForecast();
}

function renderDatePicker() {
  const today = new Date();
  // Filter offsets based on available daily data
  const offsets = weatherData.daily ? weatherData.daily.map((_, i) => i) : [];

  datePicker.innerHTML = offsets.map(offset => {
    const date = new Date();
    date.setDate(today.getDate() + offset);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const label = offset === 0 ? 'Today' : '';

    return `
      <div class="nav-link ${selectedOffset === offset ? 'active' : ''}" 
            onclick="window.selectDate(${offset})">
        <span>${month}/${day}</span>
        ${label ? `<span class="day-label">${label}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderStats(daily) {
  const mmToInches = 0.0393701;
  const snowInches = ((daily.snow || 0) * mmToInches).toFixed(1);
  return `
    <div class="stats-panel">
      <div class="stat-item">
        <span class="stat-label">Snow Forecast</span>
        <span class="stat-value">${snowInches}"</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Humidity</span>
        <span class="stat-value">${daily.humidity}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Wind</span>
        <span class="stat-value">${Math.round(daily.wind_speed * 3.6)} km/h</span>
      </div>
    </div>
  `;
}

function renderFullForecast() {
  const daily = weatherData.daily[selectedOffset];
  if (!daily) {
    fullForecast.innerHTML = '<div class="no-data">No forecast data available for this date.</div>';
    return;
  }

  const startIdx = selectedOffset * 24;
  const hours = weatherData.hourly.slice(startIdx, startIdx + 24);
  const mmToInches = 0.0393701;
  const statsHtml = renderStats(daily);

  if (hours.length > 0) {
    const snowMM = daily.snow || 0;
    fullForecast.innerHTML = `
      <div class="forecast-content">
        <div class="hourly-scroll">
          ${hours.map((h, i) => {
      const d = new Date(h.dt * 1000);
      const time = d.getHours();
      const temp = Math.round(h.temp);
      const icon = h.weather[0].icon;
      let hourlySnow = 0;
      if (snowMM > 0 && (h.weather[0].main === 'Snow' || h.pop > 0.1)) {
        hourlySnow = (snowMM / 10) * (h.pop || 0.5);
      }
      const valInches = hourlySnow * mmToInches;
      const barHeight = Math.max(2, Math.min(valInches * 50, 60));
      return `
              <div class="forecast-column">
                <span class="forecast-time">${time === 0 ? '12am' : time > 12 ? (time - 12) + 'pm' : time + 'am'}</span>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="forecast-icon" alt="weather">
                <span class="forecast-temp">${temp}°</span>
                <div class="snow-bar-container">
                  <div class="snow-bar" style="height: ${barHeight}px"></div>
                  ${valInches > 0.03 ? `<span class="snow-label">${valInches.toFixed(1)}"</span>` : ''}
                </div>
                <span class="snow-val-label">${i % 4 === 0 ? (valInches > 0 ? valInches.toFixed(1) : '0') + '"' : ''}</span>
              </div>
            `;
    }).join('')}
        </div>
        <div class="stats-divider"></div>
        ${statsHtml}
      </div>
    `;
  } else {
    const tempMax = Math.round(daily.temp.max);
    const tempMin = Math.round(daily.temp.min);
    const icon = daily.weather[0].icon;
    const desc = daily.weather[0].description;

    fullForecast.innerHTML = `
      <div class="forecast-content">
        <div class="daily-summary-left">
          <img src="https://openweathermap.org/img/wn/${icon}@4x.png" class="daily-icon" alt="${desc}">
          <div class="daily-temp-range">
            <span class="temp-max">${tempMax}°</span>
            <span class="temp-min">${tempMin}°</span>
          </div>
          <div class="daily-desc">${desc}</div>
        </div>
        <div class="stats-divider"></div>
        ${statsHtml}
      </div>
    `;
  }
}

init();
