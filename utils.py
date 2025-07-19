
import os
import re
from urllib.parse import urlparse
from collections import Counter
import pickle

TRUSTED_NEWS_DOMAINS = {"bbc.co.uk", "nytimes.com", "reuters.com", "apnews.com", "npr.org", "theguardian.com"}
UNTRUSTED_NEWS_DOMAINS = {"yourscvnews.com", "worldtruth.tv", "abcnews.com.co", "theonion.com"}

def domain_from_url(url: str) -> str:
    try:
        domain = urlparse(url).netloc.lower()
        domain = domain.lstrip('www.')
        return domain
    except Exception:
        return ""

def calculate_trust_score(domain: str) -> dict:
    if not domain:
        return {"score": 50, "status": "Unknown"}
    if domain in TRUSTED_NEWS_DOMAINS:
        return {"score": 95, "status": "Trusted"}
    if domain in UNTRUSTED_NEWS_DOMAINS:
        return {"score": 10, "status": "Untrusted"}
    if ".gov" in domain or ".edu" in domain:
        return {"score": 90, "status": "Trusted"}
    if ".co" in domain or ".blog" in domain:
        return {"score": 30, "status": "Suspicious"}
    return {"score": 60, "status": "Unknown"}

def extract_keywords(text, max_keywords=5):
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been',
                  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
    words = re.findall(r'[a-zA-Z]{3,}', text.lower())
    keywords = [word for word in words if word not in stop_words]
    word_counts = Counter(keywords)
    return [word for word, count in word_counts.most_common(max_keywords)]

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^a-z\s]', '', text)
    return text

def load_model_and_vectorizer(model_path, vectorizer_path):
    model = None
    vectorizer = None
    try:
        with open(model_path, 'rb') as model_file:
            model = pickle.load(model_file)
        with open(vectorizer_path, 'rb') as vectorizer_file:
            vectorizer = pickle.load(vectorizer_file)
        print("Model and vectorizer loaded successfully.")
    except FileNotFoundError:
        print(f"Error: Model or vectorizer file not found at {model_path} or {vectorizer_path}. Please ensure the model training script has been run.")
    except Exception as e:
        print(f"An error occurred while loading the model or vectorizer: {e}")
    return model, vectorizer
