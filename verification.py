
import requests
from utils import extract_keywords, domain_from_url, TRUSTED_NEWS_DOMAINS

def get_related_articles(query, api_key, api_url):
    """
    Fetches related articles from the configured News API.
    """
    if not api_key or "your_news_api_key" in api_key:
        return {"status": "error", "message": "News API key not configured."}
    
    # Create a query string from the list of keywords, suitable for the API
    query_string = " OR ".join(f'"{q}"' for q in query)
    
    params = {
        'q': query_string,
        'apiKey': api_key,
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 10  # We only need a few articles to verify
    }
    
    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e)}

def cross_verify_news(text, api_key, api_url):
    """
    Performs cross-verification by finding related articles from trusted sources.
    Returns a summary and a list of verified sources.
    """
    if not text or len(text) < 100:
        return {
            "verification_summary": "Article is too short for a meaningful cross-verification.",
            "verified_sources": []
        }
    
    keywords = extract_keywords(text)
    if not keywords:
        return {
            "verification_summary": "Could not extract significant keywords for cross-verification.",
            "verified_sources": []
        }
        
    search_result = get_related_articles(keywords, api_key, api_url)
    
    if search_result.get("status") != "ok":
        message = search_result.get("message", "An unknown error occurred with the News API.")
        return {
            "verification_summary": f"Could not perform cross-verification: {message}",
            "verified_sources": []
        }
        
    verified_sources = []
    for article in search_result.get("articles", []):
        source_url = article.get("url", "")
        domain = domain_from_url(source_url)
        
        if domain in TRUSTED_NEWS_DOMAINS:
            verified_sources.append({
                "title": article.get("title"),
                "url": source_url,
                "source_name": article.get("source", {}).get("name")
            })
            
        # Stop after finding 3 trusted sources to keep it efficient
        if len(verified_sources) >= 3:
            break
            
    if verified_sources:
        summary = f"Found {len(verified_sources)} similar reports from trusted sources."
    else:
        summary = "Could not find any similar reports from trusted news sources. The story may be new, niche, or unverified."
        
    return {
        "verification_summary": summary,
        "verified_sources": verified_sources
    }
