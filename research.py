
import requests
from bs4 import BeautifulSoup

# Note: To use the news_api_key, you need to get an API key from a news provider like NewsAPI.org
# and set it as an environment variable or store it securely.
NEWS_API_KEY = "your_news_api_key"

def get_related_articles(query):
    """
    Fetches related articles from a news API.
    """
    if NEWS_API_KEY == "your_news_api_key":
        return {"status": "error", "message": "News API key not configured."}
    
    url = f"https://newsapi.org/v2/everything?q={query}&apiKey={NEWS_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": str(e)}

def get_source_reputation(url):
    """
    Analyzes the reputation of the source URL.
    This is a placeholder and can be expanded with more sophisticated checks.
    """
    # Simple check: prioritize .org and .edu domains, and penalize certain TLDs
    if ".org" in url or ".edu" in url:
        return 10
    elif ".com" in url or ".co" in url:
        return 5
    elif ".net" in url or ".info" in url:
        return 2
    else:
        return 0

def fact_check(text):
    """
    Performs fact-checking on the given text.
    This is a placeholder for integrating with a fact-checking API or database.
    """
    # In a real implementation, you would connect to a fact-checking service.
    # For now, we'll return a dummy score.
    return {"score": 75, "summary": "No major issues found in a preliminary check."}

def calculate_trust_score(article_text, article_url):
    """
    Calculates a trust score based on various factors.
    """
    source_reputation = get_source_reputation(article_url)
    fact_check_results = fact_check(article_text)
    
    # Simple algorithm: average of source reputation and fact-check score
    trust_score = (source_reputation * 10 + fact_check_results["score"]) / 2
    
    return {
        "trust_score": min(trust_score, 100),
        "source_reputation": source_reputation,
        "fact_check": fact_check_results
    }
