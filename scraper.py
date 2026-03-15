#!/usr/bin/env python3
"""
🕷️ Scrapling Test Script
DHEEB Web Scraping
"""

from scrapling.fetchers import Fetcher

def scrape(url):
    try:
        f = Fetcher()
        page = f.get(url)
        return {
            'status': page.status,
            'url': url,
            'success': page.status == 200
        }
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    import sys
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://httpbin.org/html'
    result = scrape(url)
    print(result)
