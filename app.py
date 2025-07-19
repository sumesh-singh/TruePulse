from flask import Flask, jsonify, request, send_from_directory
from routes.analyze import analyze_bp
from routes.similar import similar_bp
from routes.health import health_bp
from fake_news_classifier import FakeNewsClassifier
from utils import preprocess_text, load_model_and_vectorizer
import pickle
from flask_cors import CORS
import os
import logging

# Load model and vectorizer at the start
model_path = 'fake_news_classifier_model.pkl'
vectorizer_path = 'tfidf_vectorizer.pkl'

# Initialize model and vectorizer globally
MODEL = None
VECTORIZER = None

try:
    with open(model_path, 'rb') as model_file:
        MODEL = pickle.load(model_file)
    with open(vectorizer_path, 'rb') as vectorizer_file:
        VECTORIZER = pickle.load(vectorizer_file)
    print("Model and vectorizer loaded successfully.")
except FileNotFoundError:
    print(f"Error: Model or vectorizer file not found at {model_path} or {vectorizer_path}. "
          "Please ensure the model training script has been run.")
    # Exit or handle the error appropriately
except Exception as e:
    print(f"An error occurred while loading the model or vectorizer: {e}")

app = Flask(__name__, static_folder='dist', static_url_path='')
CORS(app) # Enable CORS for all routes

app.config['FAKE_NEWS_MODEL'] = MODEL
app.config['TFIDF_VECTORIZER'] = VECTORIZER

# Register API blueprints
app.register_blueprint(health_bp)
app.register_blueprint(analyze_bp)
app.register_blueprint(similar_bp)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# Catch-all route for client-side routing
@app.errorhandler(404)
def not_found(e):
    # If the request is for an API endpoint, return JSON 404
    if request.path.startswith('/api/'): # Adjust prefix if your API has one
        return jsonify({"error": "Not Found", "message": f"The requested URL {request.path} was not found on the server."}), 404
    # Otherwise, serve the SPA's index.html for client-side routing
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
