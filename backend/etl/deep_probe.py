import httpx
import json
import os
from datetime import datetime, timezone
from collections import defaultdict

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

def probe_fuelhh():
    print("\n==================== PROBING FUELHH ====================")
    client = httpx.Client(timeout=30.0)
    
    # Test 1: Parameter testing on FUELHH
    # Try different parameter combinations
    param_tests = [
        {"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T02:00:00Z"},
        {"settlementDateFrom": "2026-01-01", "settlementDateTo": "2026-01-01"},
        {"settlementDate": "2026-01-01"},
        {"fuelType": "WIND", "publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T02:00:00Z"},
    ]
    
    for p in param_tests:
        try:
            r = client.get(f"{BASE_URL}/datasets/FUELHH/stream", params=p)
            data = r.json() if r.status_code == 200 else []
            print(f"Params {p} -> Status {r.status_code}, Records: {len(data)}")
            if data and len(data) > 0:
                print(f"  First item keys: {list(data[0].keys())}")
                fuel_types = set(d.get("fuelType") for d in data)
                print(f"  Fuel types present ({len(fuel_types)}): {sorted(list(fuel_types))[:10]}")
        except Exception as e:
            print(f"  Error for {p}: {e}")

    # Test 2: Fetch 1 full day of FUELHH to check WIND coverage and interval spacing
    print("\nFetching full day 2026-01-01 for FUELHH...")
    r = client.get(f"{BASE_URL}/datasets/FUELHH/stream", params={
        "publishDateTimeFrom": "2026-01-01T00:00:00Z",
        "publishDateTimeTo": "2026-01-02T00:00:00Z"
    })
    if r.status_code == 200:
        data = r.json()
        print(f"Total FUELHH records for 24h: {len(data)}")
        wind_records = [d for d in data if d.get("fuelType") == "WIND"]
        print(f"WIND records: {len(wind_records)}")
        if wind_records:
            print("Sample WIND record:", json.dumps(wind_records[0], indent=2))
            start_times = [d["startTime"] for d in wind_records]
            print(f"Earliest startTime: {min(start_times)}, Latest startTime: {max(start_times)}")
            # Check interval step
            sorted_wind = sorted(wind_records, key=lambda x: x["startTime"])
            steps = set()
            for i in range(1, len(sorted_wind)):
                t1 = datetime.fromisoformat(sorted_wind[i-1]["startTime"].replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(sorted_wind[i]["startTime"].replace("Z", "+00:00"))
                diff_mins = (t2 - t1).total_seconds() / 60
                steps.add(diff_mins)
            print(f"Observed interval steps (minutes): {steps}")
            print(f"Distinct settlement periods: {len(set(d.get('settlementPeriod') for d in wind_records))}")
            # Check generation stats
            gens = [d["generation"] for d in wind_records if d.get("generation") is not None]
            print(f"WIND Generation range: min={min(gens)} MW, max={max(gens)} MW, count={len(gens)}")
            
            # Save raw sample
            os.makedirs("data/raw", exist_ok=True)
            with open("data/raw/fuelhh_sample_20260101.json", "w") as f:
                json.dump(wind_records[:10], f, indent=2)
            print("Saved sample to data/raw/fuelhh_sample_20260101.json")

def probe_windfor():
    print("\n==================== PROBING WINDFOR ====================")
    client = httpx.Client(timeout=45.0)
    
    # Test 1: Parameter testing on WINDFOR
    param_tests = [
        {"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T06:00:00Z"},
        {"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-02T00:00:00Z"},
    ]
    for p in param_tests:
        r = client.get(f"{BASE_URL}/datasets/WINDFOR/stream", params=p)
        if r.status_code == 200:
            data = r.json()
            print(f"Params {p} -> Status 200, Records: {len(data)}")
            if data:
                print("Sample WINDFOR record:", json.dumps(data[0], indent=2))
        else:
            print(f"Params {p} -> Status {r.status_code}")

    # Test 2: Examine multiple publications for a single delivery date (e.g. delivery date 2026-01-02)
    # When is a forecast for 2026-01-02 published?
    # In UK wind forecasting, forecasts are published continuously ahead of delivery.
    # Let's query WINDFOR publications between 2025-12-31 and 2026-01-02
    print("\nQuerying WINDFOR publications between 2025-12-30T00:00:00Z and 2026-01-02T00:00:00Z...")
    r = client.get(f"{BASE_URL}/datasets/WINDFOR/stream", params={
        "publishDateTimeFrom": "2025-12-30T00:00:00Z",
        "publishDateTimeTo": "2026-01-02T00:00:00Z"
    })
    if r.status_code == 200:
        data = r.json()
        print(f"Total WINDFOR records published in that 3-day window: {len(data)}")
        
        # Group by startTime (delivery interval)
        by_delivery = defaultdict(list)
        for d in data:
            by_delivery[d["startTime"]].append(d)
        
        print(f"Number of distinct delivery startTimes covered: {len(by_delivery)}")
        
        # Check delivery times for 2026-01-02
        target_delivery_starts = [st for st in sorted(by_delivery.keys()) if st.startswith("2026-01-02")]
        print(f"Distinct delivery startTimes on 2026-01-02: {len(target_delivery_starts)}")
        
        if target_delivery_starts:
            sample_st = target_delivery_starts[len(target_delivery_starts)//2] # midday
            records_for_interval = by_delivery[sample_st]
            print(f"\nDelivery interval {sample_st} has {len(records_for_interval)} distinct forecast records:")
            # Sort by publishTime
            sorted_pub = sorted(records_for_interval, key=lambda x: x["publishTime"])
            for rec in sorted_pub:
                pub_t = rec["publishTime"]
                gen = rec["generation"]
                # calculate lead time in hours
                t_pub = datetime.fromisoformat(pub_t.replace("Z", "+00:00"))
                t_start = datetime.fromisoformat(sample_st.replace("Z", "+00:00"))
                lead_h = (t_start - t_pub).total_seconds() / 3600
                print(f"  Published: {pub_t} | Forecast: {gen:6.1f} MW | Lead time: {lead_h:5.1f} hours")
            
            # Test Cutoff logic!
            # Suppose decision day is 2026-01-01, cutoff is 09:00 UTC (or London time)
            cutoff = datetime.fromisoformat("2026-01-01T09:00:00+00:00")
            eligible = [r for r in records_for_interval if datetime.fromisoformat(r["publishTime"].replace("Z", "+00:00")) <= cutoff]
            if eligible:
                selected = max(eligible, key=lambda x: datetime.fromisoformat(x["publishTime"].replace("Z", "+00:00")))
                print(f"\n[Cutoff test 2026-01-01 09:00 UTC] Selected publishTime: {selected['publishTime']}, Generation: {selected['generation']} MW")
            else:
                print("\n[Cutoff test] No eligible forecast prior to cutoff!")

        # Save sample
        with open("data/raw/windfor_sample_20260101.json", "w") as f:
            json.dump(data[:15], f, indent=2)
        print("Saved sample to data/raw/windfor_sample_20260101.json")

if __name__ == "__main__":
    probe_fuelhh()
    probe_windfor()
