import httpx

client = httpx.Client(timeout=30.0)
base = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

# Let's test different query params
test_params = [
    {"from": "2026-01-01T00:00:00Z", "to": "2026-01-01T06:00:00Z"},
    {"startDateTimeFrom": "2026-01-01T00:00:00Z", "startDateTimeTo": "2026-01-01T06:00:00Z"},
    {"startTimeFrom": "2026-01-01T00:00:00Z", "startTimeTo": "2026-01-01T06:00:00Z"},
    {"settlementDateFrom": "2026-01-01", "settlementDateTo": "2026-01-01"},
    {"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T06:00:00Z"},
]

for p in test_params:
    r = client.get(base, params=p)
    data = r.json()
    print(f"Params: {p}")
    print(f"  Count: {len(data)}")
    if data:
        pub_times = sorted(set(d.get("publishTime") for d in data))
        start_times = sorted(set(d.get("startTime") for d in data))
        print(f"  Pub range: {pub_times[0]} to {pub_times[-1]}")
        print(f"  Start range: {start_times[0]} to {start_times[-1]}")
    print()
