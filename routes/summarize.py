
from flask import Blueprint, request, jsonify, current_app
from bs4 import BeautifulSoup
import re
import requests

summarize_bp = Blueprint('summarize', __name__)

@summarize_bp.route('/summarize', methods=['POST'])
def summarize_text():
    app = current_app
    summarizer = app.config.get('summarizer')
    try:
        if summarizer is None:
            app.logger.error("Summarization model is not available (summarizer=None) during summarize request.")
            return jsonify({
                "error": "Summarization model is not available on the server. Please try again later or contact the server administrator."
            }), 503
        data = request.get_json()
        if not data or 'text' not in data:
            app.logger.error("Summarize endpoint: missing 'text' field in request body.")
            return jsonify({"error": "Missing 'text' field in request body"}), 400
        text = data['text'].strip()
        if not text:
            return jsonify({"error": "Text cannot be empty"}), 400

        url_pattern = re.compile(r'^(http|https)://[^\s/$.?#].[^\s]*$', re.IGNORECASE)
        if url_pattern.match(text):
            try:
                resp = requests.get(text, timeout=10)
                if resp.status_code != 200:
                    app.logger.error(f"Failed to fetch article for summarization. HTTP status: {resp.status_code}")
                    return jsonify({
                        "error": f"Failed to fetch article. HTTP status: {resp.status_code}"
                    }), 400
                html = resp.text
                soup = BeautifulSoup(html, "html.parser")
                article = soup.find("article")
                article_text = ""
                if article:
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in article.find_all("p")])
                if not article_text:
                    ps = soup.find_all("p")
                    article_text = " ".join([p.get_text(separator=" ", strip=True) for p in ps])
                article_text = article_text.strip()
                if len(article_text.split()) < 40:
                    app.logger.error("Extracted article text too short for meaningful summary.")
                    return jsonify({
                        "error": "Could not extract enough article text from the provided URL to create a meaningful summary."
                    }), 400
                summary_input = article_text
            except Exception as e:
                app.logger.error(f"Error fetching/processing URL for summarization: {str(e)}")
                return jsonify({
                    "error": f"Unable to fetch article content from the provided URL: {str(e)}"
                }), 400
        else:
            words = text.split()
            if len(words) < 40:
                app.logger.error("Text provided too short for meaningful summarization.")
                return jsonify({
                    "error": "Text is too short to generate a meaningful summary. Please provide a longer article."
                }), 400
            summary_input = text

        try:
            summary_result = summarizer(summary_input, max_length=130, min_length=30, do_sample=False)
            summary_text = summary_result[0]['summary_text']
        except Exception as e:
            app.logger.error(f"Summarization model call failed: {str(e)}")
            import traceback
            app.logger.error(traceback.format_exc())
            return jsonify({
                "error": f"Failed to summarize text: {str(e)}"
            }), 500

        return jsonify({
            "summary": summary_text
        })
    except Exception as e:
        app.logger.error(f"Internal server error in /summarize: {str(e)}")
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({
            "error": f"Internal server error: {str(e)}"
        }), 500
