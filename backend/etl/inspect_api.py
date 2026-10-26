import httpx
import re

def main():
    r = httpx.get("https://bmrs.elexon.co.uk/api-documentation", follow_redirects=True)
    print("Documentation page status:", r.status_code, "Length:", len(r.text))
    urls = set(re.findall(r'https?://[^\s"\'<>]+', r.text))
    for u in sorted(urls):
        if "elexon" in u or "swagger" in u or "openapi" in u or "json" in u:
            print("Found URL:", u)

if __name__ == "__main__":
    main()
