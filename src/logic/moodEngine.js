/**
 * Mood Engine for Snow Cat
 * Maps weather signals to 4 snowboarder moods.
 */

export const MOODS = {
    JUMPING: 'jumping', // Mood 1: Fresh powder
    CARVING: 'carving', // Mood 2: Casual
    SITTING: 'sitting', // Mood 3: Slushy/Sticky
    SAD_WALK: 'sad_walk', // Mood 4: No snow/Melting
};

/**
 * Calculate signals from OpenWeather One Call API data
 * @param {Object} data - Processed weather data from API
 * @returns {Object} { signals, mood }
 */
export function evaluateMood(data, offset = 0) {
    const { hourly, daily } = data;

    // Signal A: Recent snow in the next 48 hours (sum of hourly.snow.1h) from selected offset
    const startIdx = offset * 24;
    const snow48h_mm = hourly.slice(startIdx, startIdx + 48).reduce((sum, h) => sum + (h.snow?.['1h'] || 0), 0);

    // Signal B: Warm streak risk (Count of daily.temp.max >= 4 in next 3 and 5 days) from selected offset
    const warm3d_count = daily.slice(offset, offset + 3).filter(d => d.temp.max >= 4).length;
    const warm5d_count = daily.slice(offset, offset + 5).filter(d => d.temp.max >= 4).length;

    // Signal C: Sunny streak risk (Clear/800-802 and UVI >= 5)
    const isSunny = (d) => [800, 801, 802].includes(d.weather[0].id) && d.uvi >= 5;
    const sun3d_count = daily.slice(offset, offset + 3).filter(isSunny).length;
    const sun5d_count = daily.slice(offset, offset + 5).filter(isSunny).length;

    // Signal D: Ice risk from freeze thaw (max >= 3 and min <= -3)
    const freezethaw_count = daily.slice(offset, offset + 3).filter(d => d.temp.max >= 3 && d.temp.min <= -3).length;

    const snow2d_mm = (daily[offset]?.snow || 0) + (daily[offset + 1]?.snow || 0);

    // --- Map to Moods ---

    // Mood 1: Jumping (Fresh powder)
    if (
        snow48h_mm >= 15 ||
        snow2d_mm >= 15 ||
        (snow48h_mm >= 8 && warm3d_count === 0)
    ) {
        return MOODS.JUMPING;
    }

    // Mood 3: Sitting (Slushy/Heavy)
    if (
        (warm3d_count >= 2 && snow48h_mm < 8) ||
        (sun3d_count >= 2 && snow48h_mm < 8) ||
        freezethaw_count >= 2
    ) {
        return MOODS.SITTING;
    }

    // Mood 4: Carrying board sadly (Melting/Depressing)
    if (
        (warm5d_count >= 4 && sun5d_count >= 3) ||
        (snow2d_mm === 0 && sun3d_count >= 2 && daily[0].temp.max >= 6) ||
        (snow48h_mm === 0 && sun5d_count >= 4)
    ) {
        return MOODS.SAD_WALK;
    }

    // Mood 2: Casual carving (Default/Groomers)
    // Usually triggered if:
    // snow48h_mm between 3-15 OR snow2d_mm between 3-15
    // OR snow48h_mm < 3 AND warm3d_count == 0 AND sun3d_count <= 1
    return MOODS.CARVING;
}
