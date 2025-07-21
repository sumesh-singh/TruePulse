from flask import Blueprint, request, jsonify, current_app
from bs4 import BeautifulSoup
import requests
import re
from verification import fetch_external_articles
from utils import domain_from_url, TRUSTED_NEWS_DOMAINS
import logging

analyze_bp = Blueprint('analyze_bp', __name__)
logger = logging.getLogger(__name__)


def get_text_from_url(url):
    """Fetches and extracts plain text from a given article URL."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'}
    try:
        response = requests.get(url, timeout=15, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        text_parts = [p.get_text(strip=True) for p in soup.find_all('p')]
        extracted_text = ' '.join(text_parts)

        if len(extracted_text.split()) < 50:
            extracted_text = soup.get_text(separator=' ', strip=True)

        return re.sub(r'\s+', ' ', extracted_text).strip()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching {url}: {e}", exc_info=True)
        return f"Error: Could not retrieve content from the URL. The site may be unresponsive or blocking requests."


@analyze_bp.route('/analyze', methods=['POST'])
def analyze_unified():
    data = request.get_json()
    if not data or (not data.get('url') and not data.get('text')):
        return jsonify({"error": "Please provide either a URL or text to analyze."}), 400
    if data.get('url') and data.get('text'):
        return jsonify({"error": "Please provide either a URL or text, not both."}), 400

    classifier = current_app.config.get('classifier')
    if not classifier:
        return jsonify({"error": "The analysis model is not loaded on the server."}), 500

    try:
        text_to_analyze = data.get('text', '').strip()
        source_domain = None

        if 'url' in data:
            url = data['url'].strip()
            source_domain = domain_from_url(url)
            text_to_analyze = get_text_from_url(url)
            if isinstance(text_to_analyze, str) and text_to_analyze.startswith("Error:"):
                return jsonify({"error": text_to_analyze}), 400
            # Log for debugging
            print(
                f"[DEBUG] Text extracted from URL ({source_domain}): {text_to_analyze[:200]}...")

        elif text:
            # Treat as plain text
            text_to_analyze = text

        # Now check the length of the extracted text, not the URL itself
        if not text_to_analyze or len(text_to_analyze.split()) < 30:
            return jsonify({"error": "The extracted article text is too short for analysis. Please provide a valid news article URL or more article text."}), 400

        # Get News API config from the app
        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')

        # Perform core AI analysis
        ai_result = classifier.classify_text(text_to_analyze)

        # Fetch external articles (includes verification and related articles)
        external_articles_data = fetch_external_articles(
            text_to_analyze, api_key, api_url)

        # Combine all results
        final_result = {**ai_result, **external_articles_data}

        # Build the final, comprehensive reasoning
        reasoning = [ai_result.get('reasoning', 'Initial AI assessment.')]

        if source_domain and source_domain in TRUSTED_NEWS_DOMAINS:
            final_result['trust_score'] = min(
                100, ai_result.get('trust_score', 50) + 20)
            reasoning.append(
                f"Source ({source_domain}) is on our trusted list, increasing credibility.")

        if external_articles_data.get("verified_sources"):
            final_result['trust_score'] = min(
                100, final_result['trust_score'] + 25)
            reasoning.append(
                "Cross-verification found similar reports from other trusted outlets.")
        else:
            final_result['trust_score'] = max(
                0, final_result['trust_score'] - 20)
            reasoning.append(
                "No similar reports were found from other major news outlets, which reduces confidence.")

        final_result['reasoning'] = " ".join(reasoning)

        # No reference to similar.py or /similar endpoint anymore
        # Only use related_articles from fetch_external_articles
        if "related_articles" in final_result:
            final_result["similar_articles"] = final_result["related_articles"]

        return jsonify(final_result)

    except Exception as e:
        logger.error(
            f"Unexpected error in /analyze endpoint: {e}", exc_info=True)
        return jsonify({"error": "An unexpected server error occurred."}), 500
