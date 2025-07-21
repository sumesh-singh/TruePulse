import requests
from utils import extract_keywords, domain_from_url, TRUSTED_NEWS_DOMAINS


def get_articles_from_api(query, api_key, api_url):
    """
    Fetches articles from the configured News API based on a query.
    """
    if not api_key or "your_news_api_key" in api_key:
        return {"status": "error", "message": "News API key not configured."}

    query_string = " OR ".join(f'"{q}"' for q in query)

    params = {
        'q': query_string,
        'apiKey': api_key,
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 10
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e)}


def fetch_external_articles(text, api_key, api_url):
    """
    Performs cross-verification and finds related articles.
    Returns a dictionary with a verification summary, a list of verified sources,
    and a list of general related articles.
    """
    keywords = extract_keywords(text, max_keywords=5)
    if not keywords:
        return {
            "verification_summary": "Could not extract keywords for verification.",
            "verified_sources": [],
            "related_articles": []
        }

    search_result = get_articles_from_api(keywords, api_key, api_url)
    print("DEBUG: News API returned articles:",
          search_result.get("articles", []))  # Add this line

    if search_result.get("status") != "ok":
        message = search_result.get(
            "message", "An unknown error occurred with the News API.")
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

        # Add to general related articles list
        if len(related_articles) < 5:  # Limit to 5
            related_articles.append(article)

        # If from a trusted domain, also add to verified list
        if domain in TRUSTED_NEWS_DOMAINS:
            if len(verified_sources) < 3:  # Limit to 3
                verified_sources.append({
                    "title": article.get("title"),
                    "url": source_url,
                    "source_name": article.get("source", {}).get("name")
                })

    if verified_sources:
        summary = f"Found {len(verified_sources)} similar reports from trusted sources."
    else:
        summary = "Could not find any similar reports from trusted news sources."

    final_result = {
        "verification_summary": summary,
        "verified_sources": verified_sources,
        "related_articles": related_articles
    }

    if "related_articles" in final_result:
        final_result["similar_articles"] = final_result["related_articles"]

    return final_result
