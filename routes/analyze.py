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
        
        # --- Improved text extraction logic ---
        main_content = soup.find('article') or soup.find('main')
        
        if main_content:
            extracted_text = main_content.get_text(separator=' ', strip=True)
        else:
            # Fallback to the original method if no <article> or <main> tag is found
            text_parts = [p.get_text(strip=True) for p in soup.find_all('p')]
            extracted_text = ' '.join(text_parts)

        # As a last resort, if the text is still too short, get all text from the body
        if len(extracted_text.split()) < 50:
            extracted_text = soup.body.get_text(separator=' ', strip=True)

        return re.sub(r's+', ' ', extracted_text).strip()

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
        text_to_analyze = ""
        source_domain = None

        if 'url' in data and data['url']:
            url = data['url'].strip()
            source_domain = domain_from_url(url)
            text_to_analyze = get_text_from_url(url)
            logger.info(f"[DEBUG] Input type: URL. Extracted text word count: {len(text_to_analyze.split())}")
            if isinstance(text_to_analyze, str) and text_to_analyze.startswith("Error:"):
                return jsonify({"error": text_to_analyze}), 400
            print(
                f"[DEBUG] Text extracted from URL ({source_domain}): {text_to_analyze[:200]}...")
        elif 'text' in data and data['text']:
            text_to_analyze = data['text'].strip()
            logger.info(f"[DEBUG] Input type: Text. Provided text word count: {len(text_to_analyze.split())}")

        if not text_to_analyze or len(text_to_analyze.split()) < 30:
            logger.warning(f"[DEBUG] Analysis failed: text_to_analyze word count ({len(text_to_analyze.split())}) is less than 30.")
            return jsonify({"error": "The extracted article text is too short for analysis. Please provide a valid news article URL or more article text."}), 400

        api_key = current_app.config.get('NEWS_API_KEY')
        api_url = current_app.config.get('NEWS_API_URL')

        ai_result = classifier.classify_text(text_to_analyze)
        external_articles_data = fetch_external_articles(
            text_to_analyze, api_key, api_url)

        # Combine AI results with external articles data
        final_result = {**ai_result, **external_articles_data}

        # Detailed reasoning generation
        reasoning_steps = []
        trust_score = ai_result.get('trust_score', 50)
        real_or_fake = ai_result.get('real_or_fake', 'Unknown')
        confidence = ai_result.get('fake_confidence', 0)

        # 1. Base AI reasoning
        reasoning_steps.append(ai_result.get('reasoning', f'The AI model classified the text as "{real_or_fake}" with {confidence}% confidence.'))

        # 2. Source Domain Trust
        if source_domain:
            if source_domain in TRUSTED_NEWS_DOMAINS:
                trust_score = min(100, trust_score + 15)
                reasoning_steps.append(f'The article is from a known trusted source ({source_domain}), which increases its credibility.')
            else:
                trust_score = max(0, trust_score - 5)
                reasoning_steps.append(f'The source ({source_domain}) is not on our list of highly trusted domains, warranting caution.')

        # 3. External Verification
        verified_sources = external_articles_data.get('verified_sources', [])
        related_articles = external_articles_data.get('related_articles', [])

        if verified_sources:
            trust_score = min(100, trust_score + 20)
            reasoning_steps.append(f'Found {len(verified_sources)} corroborating reports from other major news outlets, significantly strengthening the original claim.')
        elif related_articles:
            trust_score = min(100, trust_score + 10)
            reasoning_steps.append(f'Found {len(related_articles)} related articles discussing this topic, suggesting it is a real event.')
        else:
            trust_score = max(0, trust_score - 15)
            reasoning_steps.append('Could not find any other sources reporting on this, which lowers confidence in its authenticity.')
        
        final_result['trust_score'] = trust_score
        final_result['reasoning'] = ' '.join(reasoning_steps)

        return jsonify(final_result)

    except Exception as e:
        logger.error(
            f"Unexpected error in /analyze endpoint: {e}", exc_info=True)
        return jsonify({"error": "An unexpected server error occurred."}), 500
