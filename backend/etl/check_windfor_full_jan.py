import httpx
import time

client = httpx.Client(timeout=60.0)
base_wind = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

# Query 35 days of WINDFOR
t0 = time.time()
r = client.get(base_wind, params={
    "publishDateTimeFrom": "2025-12-30T00:00:00Z",
    "publishDateTimeTo": "2026-02-02T00:00:00Z"
})
elapsed = time.time() - t0
print(f"Status: {r.status_code}, time: {elapsed:.2f}s")
if r.status_code == 200:
    data = r.json()
    print(f"Total WINDFOR records fetched: {len(data)}")
    if data:
        pub_times = sorted(set(d["publishTime"] for d in data))
        start_times = sorted(set(d["startTime"] for d in data))
        print(f"Number of distinct publishTimes: {len(pub_times)}")
        print(f"  First publishTime: {pub_times[0]}, Last publishTime: {pub_times[-1]}")
        print(f"Number of distinct delivery startTimes: {len(start_times)}")
        print(f"  First startTime: {start_times[0]}, Last startTime: {start_times[-1]}")
