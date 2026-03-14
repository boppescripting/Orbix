'use strict';

const express = require('express');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// WMO weather code → label + emoji
function describeCode(code) {
  if (code === 0)                          return { label: 'Clear sky',        icon: '☀️' };
  if (code === 1)                          return { label: 'Mainly clear',      icon: '🌤️' };
  if (code === 2)                          return { label: 'Partly cloudy',     icon: '⛅' };
  if (code === 3)                          return { label: 'Overcast',          icon: '☁️' };
  if (code === 45 || code === 48)          return { label: 'Foggy',             icon: '🌫️' };
  if (code >= 51 && code <= 55)            return { label: 'Drizzle',           icon: '🌦️' };
  if (code >= 56 && code <= 57)            return { label: 'Freezing drizzle',  icon: '🌧️' };
  if (code >= 61 && code <= 65)            return { label: 'Rain',              icon: '🌧️' };
  if (code >= 66 && code <= 67)            return { label: 'Freezing rain',     icon: '🌧️' };
  if (code >= 71 && code <= 77)            return { label: 'Snow',              icon: '🌨️' };
  if (code >= 80 && code <= 82)            return { label: 'Rain showers',      icon: '🌧️' };
  if (code === 85 || code === 86)          return { label: 'Snow showers',      icon: '🌨️' };
  if (code === 95)                         return { label: 'Thunderstorm',      icon: '⛈️' };
  if (code === 96 || code === 99)          return { label: 'Thunderstorm',      icon: '⛈️' };
  return { label: 'Unknown', icon: '🌡️' };
}

// POST /api/integrations/weather
router.post('/', async (req, res) => {
  const { city, lat, lon, unit = 'celsius' } = req.body;

  if (!city && (lat == null || lon == null)) {
    return res.status(400).json({ error: 'Provide city or lat/lon' });
  }
  if (unit !== 'celsius' && unit !== 'fahrenheit') {
    return res.status(400).json({ error: 'unit must be celsius or fahrenheit' });
  }

  try {
    let latitude  = parseFloat(lat);
    let longitude = parseFloat(lon);
    let locationName = city;

    // Geocode city name if coordinates not provided
    if (city && (lat == null || lon == null)) {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
        { signal: AbortSignal.timeout(6000) }
      );
      const geoData = await geoRes.json();
      if (!geoData.results?.length) {
        return res.status(404).json({ error: `Location "${city}" not found` });
      }
      const place = geoData.results[0];
      latitude     = place.latitude;
      longitude    = place.longitude;
      locationName = [place.name, place.admin1, place.country_code].filter(Boolean).join(', ');
    }

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
      `&temperature_unit=${unit}` +
      `&wind_speed_unit=kmh` +
      `&timezone=auto`,
      { signal: AbortSignal.timeout(6000) }
    );
    const weatherData = await weatherRes.json();

    if (!weatherRes.ok || !weatherData.current) {
      return res.status(502).json({ error: 'Failed to fetch weather data' });
    }

    const c = weatherData.current;
    const { label, icon } = describeCode(c.weather_code);

    return res.json({
      location:    locationName,
      temperature: Math.round(c.temperature_2m),
      feelsLike:   Math.round(c.apparent_temperature),
      humidity:    c.relative_humidity_2m,
      windSpeed:   Math.round(c.wind_speed_10m),
      condition:   label,
      icon,
      unit,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
});

module.exports = router;
