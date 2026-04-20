# API Integrations

---

## Aladhan Prayer Times API

### Overview

The app fetches Islamic prayer times from the free [Aladhan API](https://aladhan.com/prayer-times-api). Times are fetched per city per day and cached in memory.

### Endpoint

```
GET https://api.aladhan.com/v1/timingsByCity/{date}?city={city}&country={country}&method={method}&adjustment={adjustment}
```

### Parameters

| Parameter | Value | Description |
|---|---|---|
| `date` | `DD-MM-YYYY` | Target date |
| `city` | URL-encoded string | City name (e.g., `"Houston"`) |
| `country` | URL-encoded string | Country (default: `"United States"`) |
| `method` | `2` | ISNA (Islamic Society of North America) calculation method |
| `adjustment` | `1` | +1 day adjustment to match user's existing setup |

### Response Format

```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "timings": {
      "Fajr": "05:23",
      "Sunrise": "06:45",
      "Dhuhr": "13:05",
      "Asr": "16:38",
      "Maghrib": "19:25",
      "Isha": "20:45"
    }
  }
}
```

### Response Models

#### AladhanResponse

| Field | Type |
|---|---|
| `code` | Int |
| `status` | String |
| `data` | AladhanData |

#### AladhanData

| Field | Type |
|---|---|
| `timings` | AladhanTimings |

#### AladhanTimings

| Field | Type | Description |
|---|---|---|
| `Fajr` | String | `"HH:mm"` format |
| `Sunrise` | String | `"HH:mm"` format |
| `Dhuhr` | String | `"HH:mm"` format |
| `Asr` | String | `"HH:mm"` format |
| `Maghrib` | String | `"HH:mm"` format |
| `Isha` | String | `"HH:mm"` format |

#### dateFor(prayer, date) method

Converts a time string (e.g., `"05:23"`) to a full `Date` on the given day:

1. Select the time string based on the prayer enum value. `jumuah` maps to `Dhuhr`.
2. Split by `":"` to get `[hour, minute]`
3. Set hour and minute on the target date using the calendar

### Caching

- In-memory dictionary keyed by `"{city_lowercase}-{date_string}"`
- No TTL — cache lives for the process lifetime
- Each city+date combination is fetched only once

### Error Handling

| Error | Condition |
|---|---|
| `invalidURL` | City/country encoding fails or URL construction fails |
| `badResponse` | HTTP status code is not 200 |

### Usage Flow

```
1. DayViewModel.loadDay() is called
2. Calls PrayerTimesService.fetchPrayerTimes(city, date)
3. Service checks in-memory cache
4. If cache miss → HTTP GET → decode JSON → cache result
5. Returns AladhanTimings to caller
6. BlockResolver uses AladhanTimings to compute start times
```
