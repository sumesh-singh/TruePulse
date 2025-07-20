
import os
import re
from urllib.parse import urlparse
from collections import Counter

TRUSTED_NEWS_DOMAINS = {"bbc.co.uk", "nytimes.com", "reuters.com", "apnews.com", "npr.org", "theguardian.com"}
UNTRUSTED_NEWS_DOMAINS = {"yourscvnews.com", "worldtruth.tv", "abcnews.com.co", "theonion.com"}

def domain_from_url(url: str) -> str:
    try:
        domain = urlparse(url).netloc.lower()
        domain = domain.lstrip('www.')
        return domain
    except Exception:
        return ""

def calculate_trust_score(domain: str) -> dict:
    if not domain:
        return {"score": 50, "status": "Unknown"}
    if domain in TRUSTED_NEWS_DOMAINS:
        return {"score": 95, "status": "Trusted"}
    if domain in UNTRUSTED_NEWS_DOMAINS:
        return {"score": 10, "status": "Untrusted"}
    if ".gov" in domain or ".edu" in domain:
        return {"score": 90, "status": "Trusted"}
    if ".co" in domain or ".blog" in domain:
        return {"score": 30, "status": "Suspicious"}
    return {"score": 60, "status": "Unknown"}

def extract_keywords(text, max_keywords=5):
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
    words = re.findall(r'[a-zA-Z]{3,}', text.lower())
    keywords = [word for word in words if word not in stop_words]
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(max_keywords)]
