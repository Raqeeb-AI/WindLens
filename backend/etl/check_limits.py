import httpx
import time

client = httpx.Client(timeout=60.0)
base_fuel = "https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream"
base_wind = "https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream"

def test_limits():
    print("=== Testing response window / size limits ===")
    
    # 1. Test FUELHH with fuelType=WIND for 7 days
    t0 = time.time()
    r = client.get(base_fuel, params={
        "fuelType": "WIND",
        "publishDateTimeFrom": "2026-01-01T00:00:00Z",
        "publishDateTimeTo": "2026-01-08T00:00:00Z"
    })
    elapsed = time.time() - t0
    data = r.json() if r.status_code == 200 else []
    print(f"FUELHH (fuelType=WIND) 7 days: status {r.status_code}, count={len(data)}, time={elapsed:.2f}s")
    
    # 2. Test FUELHH for 31 days (entire month of January 2026)
    t0 = time.time()
    r = client.get(base_fuel, params={
        "fuelType": "WIND",
        "publishDateTimeFrom": "2026-01-01T00:00:00Z",
        "publishDateTimeTo": "2026-02-01T00:00:00Z"
    })
    elapsed = time.time() - t0
    data = r.json() if r.status_code == 200 else []
    print(f"FUELHH (fuelType=WIND) 31 days: status {r.status_code}, count={len(data)}, time={elapsed:.2f}s")
    if data:
        start_times = [d["startTime"] for d in data]
        print(f"  FUELHH span: {min(start_times)} to {max(start_times)}")
        # Check nulls or negative values
        nulls = sum(1 for d in data if d.get("generation") is None)
        negatives = sum(1 for d in data if d.get("generation") is not None and d["generation"] < 0)
        print(f"  FUELHH nulls={nulls}, negatives={negatives}")

    # 3. Test WINDFOR for 7 days
    t0 = time.time()
    r = client.get(base_wind, params={
        "publishDateTimeFrom": "2026-01-01T00:00:00Z",
        "publishDateTimeTo": "2026-01-08T00:00:00Z"
    })
    elapsed = time.time() - t0
    data = r.json() if r.status_code == 200 else []
    print(f"WINDFOR 7 days: status {r.status_code}, count={len(data)}, time={elapsed:.2f}s")
    if data:
        pub_times = sorted(set(d["publishTime"] for d in data))
        print(f"  Distinct publishTimes in 7 days: {len(pub_times)}")

if __name__ == "__main__":
    test_limits()
