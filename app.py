
from flask import Flask, jsonify, request, send_from_directory
from routes.analyze import analyze_bp
from routes.health import health_bp
from fake_news_classifier import FakeNewsClassifier
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Create Flask application instance
app = Flask(__name__, static_folder='dist', static_url_path='')

# Enable CORS for all
CORS(app)

# Initialize the classifier.
# This class handles loading its own models from Hugging Face.
try:
    classifier = FakeNewsClassifier()
    app.logger.info("✅ Fake News Classifier and its models loaded successfully.")
except Exception as e:
    app.logger.error(f"❌ Failed to load FakeNewsClassifier: {e}")
    classifier = None

# Make the classifier available to the routes
app.config['classifier'] = classifier

# Register API blueprints
app.register_blueprint(health_bp)
app.register_blueprint(analyze_bp)

@app.route('/')
def serve_index():
    # Serves the built frontend
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    # Serves other static files like CSS, JS, etc.
    return send_from_directory(app.static_folder, path)

@app.errorhandler(404)
def not_found(e):
    # Serves the index.html for any path that is not an API route,
    # enabling client-side routing.
    if not request.path.startswith('/api/'):
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify(error='Not Found'), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # Use Gunicorn or another production-ready server in production
    app.run(host='0.0.0.0', port=port)
