
from flask import Blueprint, request, jsonify, current_app
from bs4 import BeautifulSoup
import requests
from verification import cross_verify_news
from utils import domain_from_url, TRUSTED_NEWS_DOMAINS

analyze_bp = Blueprint('analyze_bp', __name__)

def get_text_from_url(url):
    """Fetches and extracts plain text from a given article URL."""
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        paragraphs = soup.find_all('p')
        article_text = ' '.join(p.get_text() for p in paragraphs)
        
        if len(article_text.split()) < 50:
             article_text = soup.get_text(separator=' ', strip=True)

        return article_text
    except requests.exceptions.HTTPError as e:
        if e.response.status_code in [401, 403]:
            return f"Error: Cannot access content from {url}. The site may be blocking automated requests or require a subscription."
        return f"Error: Failed to fetch content due to an HTTP error: {e}"
    except requests.exceptions.RequestException as e:
        return f"Error: Failed to fetch content from URL: {e}"

def perform_full_analysis(text, classifier, api_key, api_url):
    """Helper function to run the complete analysis suite on a given text."""
    analysis_result = classifier.classify_text(text)
    verification_result = cross_verify_news(text, api_key, api_url)
    final_result = {**analysis_result, **verification_result}
    
    if verification_result.get("verified_sources"):
        final_result['reasoning'] += " Furthermore, cross-verification found similar reports from other trusted news outlets, strengthening the story's credibility."
        final_result['trust_score'] = min(100, final_result['trust_score'] + 15)
    else:
        final_result['reasoning'] += " However, cross-verification could not find similar reports from major news outlets. This could mean the story is new, niche, or potentially unverified."
        final_result['trust_score'] = max(0, final_result['trust_score'] - 15)
        
    return final_result

@analyze_bp.route('/analyze-text', methods=['POST'])
def analyze_text_article():
    """Analyzes a raw block of text."""
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify({"error": "Invalid request: 'text' field is required."}), 400

    text_to_analyze = data.get('text').strip()
    if len(text_to_analyze.split()) < 30:
        return jsonify({"error": "Pasted text is too short for a meaningful analysis."}), 400

    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "The analysis model is not loaded on the server."}), 500

    try:
        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')
        result = perform_full_analysis(text_to_analyze, classifier, api_key, api_url)
        return jsonify(result)
    except Exception as e:
        current_app.logger.error(f"Error in /analyze-text: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred during text analysis."}), 500

@analyze_bp.route('/analyze-url', methods=['POST'])
def analyze_url_article():
    """Analyzes an article from a URL."""
    data = request.get_json()
    if not data or not data.get('url'):
        return jsonify({"error": "Invalid request: 'url' field is required."}), 400

    url = data.get('url').strip()
    domain = domain_from_url(url)
    
    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "The analysis model is not loaded on the server."}), 500

    try:
        text_to_analyze = get_text_from_url(url)
        if isinstance(text_to_analyze, str) and text_to_analyze.startswith("Error:"):
            return jsonify({"error": text_to_analyze}), 400

        if len(text_to_analyze.split()) < 30:
            return jsonify({"error": "Could not extract enough text from the URL for a meaningful analysis."}), 400

        analysis_result = classifier.classify_text(text_to_analyze)

        if domain in TRUSTED_NEWS_DOMAINS:
            analysis_result['trust_score'] = 95
            analysis_result['reasoning'] = f"The primary analysis is based on content from '{domain}', which is on our list of trusted news sources. Cross-verification was deemed unnecessary."
            analysis_result['verification_summary'] = "Source is on trusted list; cross-verification skipped."
            analysis_result['verified_sources'] = []
            return jsonify(analysis_result)
        else:
            api_key = current_app.config.get('NEWS_API_KEY')
            api_url = current_app.config.get('NEWS_API_URL')
            full_result = perform_full_analysis(text_to_analyze, classifier, api_key, api_url)
            full_result['reasoning'] = f"Analysis of content from '{domain}'. " + full_result['reasoning']
            return jsonify(full_result)

    except Exception as e:
        current_app.logger.error(f"Error in /analyze-url: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred during URL analysis."}), 500
