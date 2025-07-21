
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
             # Fallback for sites not using <p> tags, get all text
             article_text = soup.get_text(separator=' ', strip=True)

            article_text = soup.get_text(separator=' ', strip=True)
        return article_text
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code
        if status_code in [401, 403, 404, 410]:
             return f"Error: Could not retrieve content from the URL (Status code: {status_code}). The site may be blocking scrapers, require a subscription, or the page may not exist."
        return f"Error: Failed to fetch content due to an HTTP error: {e}"
    except requests.exceptions.RequestException as e:
        return f"Error: A network error occurred while fetching the URL: {e}"

def perform_full_analysis(text, classifier, api_key, api_url, source_domain=None):
    """Helper function to run the complete analysis suite on a given text."""
    ai_result = classifier.classify_text(text)
    verification_result = cross_verify_news(text, api_key, api_url)
    
    final_result = {**ai_result, **verification_result}
    
    reasoning = []
    
    # Start with AI model's assessment
    reasoning.append(ai_result.get('reasoning', 'The AI model provided an initial assessment.'))
    
    # Factor in the source domain if available
    if source_domain:
        if source_domain in TRUSTED_NEWS_DOMAINS:
            final_result['trust_score'] = min(100, ai_result.get('trust_score', 50) + 20) # Boost score
            reasoning.append(f"The article is from a trusted source ({source_domain}), which strongly supports its authenticity.")
        else:
            reasoning.append(f"The source domain is '{source_domain}'.")

    # Factor in cross-verification
    if verification_result.get("verified_sources"):
        final_result['trust_score'] = min(100, final_result['trust_score'] + 25) # Big boost for verification
        reasoning.append("Cross-verification found similar reports from other trusted news outlets, significantly increasing confidence in the story's authenticity.")
    else:
        final_result['trust_score'] = max(0, final_result['trust_score'] - 20) # Penalize if no verification
        reasoning.append("Cross-verification could not find similar reports from major news outlets. This could mean the story is breaking, niche, or potentially unverified, which reduces confidence.")
        
    final_result['reasoning'] = " ".join(reasoning)
    return final_result

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_unified():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request body."}), 400

    url = data.get('url', '').strip()
    text = data.get('text', '').strip()

    if not url and not text:
        return jsonify({"error": "Please provide either a URL or text to analyze."}), 400
    if url and text:
        return jsonify({"error": "Please provide either a URL or text, not both."}), 400

    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "The analysis model is not loaded on the server."}), 500

    try:
        text_to_analyze = text
        source_domain = None

        if url:
            source_domain = domain_from_url(url)
            text_to_analyze = get_text_from_url(url)
            if isinstance(text_to_analyze, str) and text_to_analyze.startswith("Error:"):
                return jsonify({"error": text_to_analyze}), 400

        if not text_to_analyze or len(text_to_analyze.split()) < 30:
            return jsonify({"error": "The text for analysis is too short. Please provide a valid article or URL."}), 400
        
        # Get News API config from the app
        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')

        result = perform_full_analysis(text_to_analyze, classifier, api_key, api_url, source_domain)
        return jsonify(result)

    except Exception as e:
        current_app.logger.error(f"Unexpected error in /analyze endpoint: {e}", exc_info=True)
        return jsonify({"error": "An unexpected server error occurred during analysis."}), 500
