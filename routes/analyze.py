
from flask import Blueprint, request, jsonify, current_app
from bs4 import BeautifulSoup
import requests
import re
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
    if not data or 'text' not in data:
        return jsonify({"error": "Invalid request: no data provided"}), 400

    input_text = data.get('text').strip()
    
    # Regex to determine if the input is a URL
    url_pattern = re.compile(r'https?://\S+')
    text_to_analyze = ""

    if url_pattern.match(input_text):
        # If the input is a URL, fetch the content
        text_to_analyze = get_text_from_url(input_text)
        if isinstance(text_to_analyze, str) and text_to_analyze.startswith("Error:"):
            return jsonify({"error": text_to_analyze}), 400
    else:
        # Otherwise, treat the input as the text to analyze
        text_to_analyze = input_text

    # Now, perform the length check on the actual article content
    if not text_to_analyze or len(text_to_analyze.strip().split()) < 30:
        return jsonify({"error": "Text is too short for a meaningful analysis. Please provide a valid article or URL."}), 400

    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "Classifier model is not loaded on the server."}), 500

    try:
        # Perform the core AI analysis on the fetched/provided text
        analysis_result = classifier.classify_text(text_to_analyze)
        
        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')
        
        # Perform cross-verification on the text
        verification_result = cross_verify_news(text_to_analyze, api_key, api_url)
        
        # Combine and enhance the results
        final_result = {**analysis_result, **verification_result}
        
        if verification_result.get("verified_sources"):
            final_result['reasoning'] += f" Furthermore, cross-verification found similar reports from other trusted news outlets, increasing confidence in the story's authenticity."
            final_result['trust_score'] = min(100, final_result['trust_score'] + 15)
        else:
            final_result['reasoning'] += f" However, cross-verification could not find similar reports from major news outlets. This could mean the story is breaking, niche, or potentially unverified."
            final_result['trust_score'] = max(0, final_result['trust_score'] - 15)

        return jsonify(final_result)
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Unexpected error in /analyze: {e}", exc_info=True)
        return jsonify({"error": "An unexpected error occurred during analysis."}), 500
