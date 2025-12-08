// netlify/functions/yr-weather.js
export async function handler(event, context) {
  const params = event.queryStringParameters || {};
  const lat = parseFloat(params.lat);
  const lon = parseFloat(params.lon);

  if (isNaN(lat) || isNaN(lon)) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Missing or invalid lat/lon query parameters" })
    };
  }

  const metUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(
    4
  )}&lon=${lon.toFixed(4)}`;

  try {
    const res = await fetch(metUrl, {
      headers: {
        "User-Agent": "fishing-log-app/1.0 (contact: ilmar.murakas@gmail.com)",
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: "MET API error", status: res.status })
      };
    }

    const data = await res.json();

    const ts0 = data?.properties?.timeseries?.[0];
    const instant = ts0?.data?.instant?.details || {};
    const next1h = ts0?.data?.['next_1_hours']?.summary || {};

    const temperature = typeof instant.air_temperature === "number" ? instant.air_temperature : null;
    const windSpeed = typeof instant.wind_speed === "number" ? instant.wind_speed : null;
    const cloudCover = typeof instant.cloud_area_fraction === "number" ? instant.cloud_area_fraction : null;
    const symbol = next1h.symbol_code || null;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        temperature,
        windSpeed,
        cloudCover,
        symbol
      })
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ error: "Internal error calling MET API" })
    };
  }
}
