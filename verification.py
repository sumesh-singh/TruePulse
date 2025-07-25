import requests
from utils import extract_keywords, domain_from_url, TRUSTED_NEWS_DOMAINS


def get_articles_from_api(query, api_key, api_url):
    """
    Fetches articles from the configured News API based on a query.
    """
    if not api_key or "your_news_api_key" in api_key:
        print("DEBUG: News API key is not configured or is a placeholder.")
        return {"status": "error", "message": "News API key not configured."}

    query_string = " OR ".join(f'"{q}"' for q in query)
    print(f"DEBUG: Fetching articles from News API with query: {query_string}")

    params = {
        'q': query_string,
        'apiKey': api_key,
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 100 
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        search_result = response.json()
        print(f"DEBUG: News API response status: {search_result.get('status')}, totalResults: {search_result.get('totalResults')}")
        return search_result
    except requests.exceptions.RequestException as e:
        print(f"DEBUG: Error fetching from News API: {e}")
        return {"status": "error", "message": str(e)}


def fetch_external_articles(text, api_key, api_url):
    """
    Performs cross-verification and finds related articles.
    Returns a dictionary with a verification summary, a list of verified sources,
    and a list of general related articles.
    """
    keywords = extract_keywords(text, max_keywords=5)
    print(f"DEBUG: Extracted keywords for News API search: {keywords}")
    if not keywords:
        print("DEBUG: No keywords extracted for verification.")
        return {
            "verification_summary": "Could not extract keywords for verification.",
            "verified_sources": [],
            "related_articles": []
        }

    search_result = get_articles_from_api(keywords, api_key, api_url)
    

    if search_result.get("status") != "ok":
        message = search_result.get(
            "message", "An unknown error occurred with the News API.")
        print(f"DEBUG: News API search failed: {message}")
        return {
            "verification_summary": f"Could not perform verification: {message}",
            "verified_sources": [],
            "related_articles": []
        }

    verified_sources = []
    related_articles = []

    for article in search_result.get("articles", []):
        source_url = article.get("url", "")
        domain = domain_from_url(source_url)
        
        # Categorize articles
        if domain in TRUSTED_NEWS_DOMAINS:
            # If from a trusted domain, add to verified list - limit to 3
            if len(verified_sources) < 3:
                verified_sources.append({
                    "title": article.get("title"),
                    "url": source_url,
                    "source_name": article.get("source", {}).get("name")
                })
        else:
            # Otherwise, add to general related articles list - limiting to 6
            if len(related_articles) < 6:
                related_articles.append(article)

    if verified_sources:
        summary = f"Found {len(verified_sources)} similar reports from trusted sources."
    else:
        summary = "Could not find any similar reports from trusted news sources."

    print(f"DEBUG: Verified sources found: {len(verified_sources)}")
    print(f"DEBUG: Related articles found (after limit): {len(related_articles)}")

    return {
        "verification_summary": summary,
        "verified_sources": verified_sources,
        "related_articles": related_articles
    }
