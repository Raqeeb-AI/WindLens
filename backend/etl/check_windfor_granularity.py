import httpx
from datetime import datetime
from collections import defaultdict

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
client = httpx.Client(timeout=45.0)

# Fetch WINDFOR for a range of publications to examine startTimes
r = client.get(f"{BASE_URL}/datasets/WINDFOR/stream", params={
    "publishDateTimeFrom": "2026-01-01T00:00:00Z",
    "publishDateTimeTo": "2026-01-01T12:00:00Z"
})
data = r.json()
print("Number of WINDFOR records in 12h publish window:", len(data))

# Group by publishTime
by_pub = defaultdict(list)
for d in data:
    by_pub[d["publishTime"]].append(d)

print(f"Number of distinct publishTimes in 12h: {len(by_pub)}")
for pub_t in sorted(by_pub.keys()):
    records = by_pub[pub_t]
    start_times = sorted([r["startTime"] for r in records])
    print(f"\nPublishTime {pub_t}: {len(records)} forecast intervals")
    print(f"  Horizon: {start_times[0]} to {start_times[-1]}")
    # Compute step differences between consecutive startTimes
    steps = set()
    for i in range(1, len(start_times)):
        t1 = datetime.fromisoformat(start_times[i-1].replace("Z", "+00:00"))
        t2 = datetime.fromisoformat(start_times[i].replace("Z", "+00:00"))
        steps.add((t2 - t1).total_seconds() / 60)
    print(f"  Interval steps between consecutive startTimes: {steps} minutes")
    print(f"  First 5 startTimes: {start_times[:5]}")
