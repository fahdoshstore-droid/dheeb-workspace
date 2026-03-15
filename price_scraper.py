#!/usr/bin/env python3
"""
Simple Price Scraper
Scrapes prices from web pages using requests + BeautifulSoup
"""

import requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional

# Common price patterns (handles: $19.99, $1,299.00, 19.99$, etc.)
PRICE_PATTERN = re.compile(r'[\$£€]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*[\$£€]?')


def fetch_page(url: str, timeout: int = 10) -> Optional[str]:
    """Fetch HTML content from URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=timeout)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def extract_prices(html: str) -> List[float]:
    """Extract all prices from HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    prices = []
    
    # Look for common price selectors
    price_elements = soup.find_all(string=PRICE_PATTERN)
    
    for elem in price_elements:
        match = PRICE_PATTERN.search(elem)
        if match:
            try:
                price_str = match.group(1).replace(',', '')
                prices.append(float(price_str))
            except ValueError:
                continue
    
    return prices


def scrape_product_page(url: str) -> Dict:
    """Scrape product info and prices from a page"""
    html = fetch_page(url)
    if not html:
        return {"error": "Failed to fetch page", "prices": []}
    
    soup = BeautifulSoup(html, 'html.parser')
    prices = extract_prices(html)
    
    # Try to get page title
    title = soup.title.string if soup.title else "No title"
    
    return {
        "url": url,
        "title": title.strip() if title else "No title",
        "prices_found": len(prices),
        "prices": prices,
        "min_price": min(prices) if prices else None,
        "max_price": max(prices) if prices else None
    }


# Example usage - scrape a sample e-commerce page
if __name__ == "__main__":
    import sys
    
    # Default sample URL (Amazon product page example)
    sample_url = "https://www.example.com"
    
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        # For demo, show how it works without a real URL
        print("Usage: python price_scraper.py <URL>")
        print("\nExample with sample HTML:")
        
        sample_html = """
        <html><head><title>Product Page</title></head><body>
        <span class="price">$19.99</span>
        <span class="price">$29.99</span>
        <span class="old-price">$49.99</span>
        </body></html>
        """
        
        prices = extract_prices(sample_html)
        print(f"Prices found: {prices}")
        print(f"Min: {min(prices)}, Max: {max(prices)}")
        sys.exit(0)
    
    result = scrape_product_page(url)
    print(f"Title: {result.get('title')}")
    print(f"Prices found: {result.get('prices_found')}")
    print(f"All prices: {result.get('prices')}")
    print(f"Min: {result.get('min_price')}, Max: {result.get('max_price')}")
