import httpx
import json

def test_endpoint(url, params=None):
    print(f"Testing URL: {url} with params {params}")
    try:
        with httpx.Client(timeout=20.0, follow_redirects=True) as client:
            resp = client.get(url, params=params)
            print(f"Status: {resp.status_code}")
            print(f"Headers: {dict(list(resp.headers.items())[:5])}")
            print(f"Content-Type: {resp.headers.get('content-type')}")
            text_preview = resp.text[:1000]
            print(f"Body preview:\n{text_preview}\n---")
            return resp
    except Exception as e:
        print(f"Error requesting {url}: {e}")
        return None

if __name__ == "__main__":
    # Test documentation URL or redirect
    print("--- 1. Testing doc / base URLs ---")
    test_endpoint("https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream", params={"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T01:00:00Z"})
    test_endpoint("https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream", params={"publishDateTimeFrom": "2026-01-01T00:00:00Z", "publishDateTimeTo": "2026-01-01T01:00:00Z"})
