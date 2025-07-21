
from flask import Blueprint, request, jsonify, current_app
from utils import extract_keywords
import requests

similar_bp = Blueprint('similar_bp', __name__)




@similar_bp.route('/similar', methods=['POST'])
def find_similar_articles():
    """
    Finds articles related to the given text by extracting keywords
    and querying the News API.
    """
    data = request.get_json()
    if not data or not data.get('text'):
        return jsonify({"error": "Invalid request: 'text' field is required."}), 400

    text = data['text']
    api_key = current_app.config.get('NEWS_API_KEY')
    api_url = current_app.config.get('NEWS_API_URL')

    if not api_key or "your_news_api_key" in api_key:
        return jsonify({"articles": [], "error": "News API key not configured on the server."})

    # Extract keywords to form a search query
    keywords = extract_keywords(text)
    if not keywords:
        return jsonify({"articles": [], "error": "Could not extract keywords for finding similar articles."})

    query = " OR ".join(f'"{q}"' for q in keywords)
    params = {
        'q': query,
        'apiKey': api_key,
        'language': 'en',
        'sortBy': 'relevancy',
        'pageSize': 5  # Limit to 5 related articles
    }

    try:
        response = requests.get(api_url, params=params)
        response.raise_for_status()
        news_data = response.json()
        return jsonify({"articles": news_data.get("articles", [])})
        
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Error fetching from News API: {e}")
        return jsonify({"articles": [], "error": f"Could not connect to the news service: {e}"}), 500
