
from flask import Blueprint, request, jsonify, current_app
from bs4 import BeautifulSoup
import requests
from verification import cross_verify_news

analyze_bp = Blueprint('analyze_bp', __name__)

def get_text_from_url(url):
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        paragraphs = soup.find_all('p')
        article_text = ' '.join(p.get_text() for p in paragraphs)
        
        if len(article_text.split()) < 50:
             # Fallback for sites not using <p> tags, get all text
             article_text = soup.get_text(separator=' ', strip=True)

        return article_text
    except requests.exceptions.HTTPError as e:
        if e.response.status_code in [401, 403]:
            return f"Error: Cannot access content from {url}. The site may be blocking automated requests or require a subscription."
        return f"Error: Failed to fetch content due to an HTTP error: {e}"
    except requests.exceptions.RequestException as e:
        return f"Error: Failed to fetch content from URL: {e}"

@analyze_bp.route('/analyze', methods=['POST'])
def analyze_article():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request: no data provided"}), 400

    text = data.get('text')
    url = data.get('url')

    if not text and url:
        text = get_text_from_url(url)
        if isinstance(text, str) and text.startswith("Error:"):
            return jsonify({"error": text}), 400
    
    if not text or len(text.strip().split()) < 30:
        return jsonify({"error": "Text is too short for a meaningful analysis."}), 400

    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "Classifier model is not loaded on the server."}), 500

    try:
        # Perform the core AI analysis (sentiment, fake news)
        analysis_result = classifier.classify_text(text)
        
        # Get News API config from the app
        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')
        
        # Perform the new cross-verification step
        verification_result = cross_verify_news(text, api_key, api_url)
        
        # Combine the results
        final_result = {**analysis_result, **verification_result}
        
        # Enhance the final reasoning and adjust trust score based on verification
        if verification_result.get("verified_sources"):
            final_result['reasoning'] += f" Furthermore, cross-verification found similar reports from other trusted news outlets, increasing confidence in the story's authenticity."
            # Boost trust score if verified
            final_result['trust_score'] = min(100, final_result['trust_score'] + 15)
        else:
            final_result['reasoning'] += f" However, cross-verification could not find similar reports from major news outlets. This could mean the story is breaking, niche, or potentially unverified."
            # Penalize trust score if not verified by other sources
            final_result['trust_score'] = max(0, final_result['trust_score'] - 15)

        return jsonify(final_result)
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error in /analyze: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred during analysis."}), 500
