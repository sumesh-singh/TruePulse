
from transformers import pipeline
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FakeNewsClassifier:
    def __init__(self):
        """Initialize the sentiment analysis pipeline"""
        self.classifier = None
        self.load_model()

    def load_model(self):
        """Load the HuggingFace transformers pipeline for sentiment analysis"""
        try:
            logger.info("Loading sentiment analysis model...")
            # Use a proper sentiment analysis model
            self.classifier = pipeline(
                'sentiment-analysis',
                model='cardiffnlp/twitter-roberta-base-sentiment-latest',
                return_all_scores=True
            )
            logger.info("✓ Sentiment analysis model loaded successfully")
        except Exception as e:
            logger.error(f"✗ Failed to load model: {e}")
            # Fallback to a basic sentiment model
            try:
                self.classifier = pipeline(
                    'sentiment-analysis',
                    model='distilbert-base-uncased-finetuned-sst-2-english',
                    return_all_scores=True
                )
                logger.info("✓ Fallback sentiment analysis model loaded successfully")
            except Exception as fallback_error:
                logger.error(f"✗ Failed to load fallback model: {fallback_error}")
                self.classifier = None

    def classify_text(self, text):
        """
        Perform sentiment analysis on text

        Args:
            text (str): The text to analyze

        Returns:
            dict: Contains sentiment analysis results and analytics
        """
        if self.classifier is None:
            raise RuntimeError(
                "Model not loaded. Cannot perform classification.")

        if not isinstance(text, str) or not text.strip():
            raise ValueError("Text must be a non-empty string")

        try:
            # Get sentiment analysis results
            results = self.classifier(text)

            # Find the result with highest confidence
            best_result = max(results, key=lambda x: x['score'])
            
            # Map labels to readable format
            label_mapping = {
                'NEGATIVE': 'Negative',
                'POSITIVE': 'Positive', 
                'NEUTRAL': 'Neutral',
                'LABEL_0': 'Negative',
                'LABEL_1': 'Positive',
                'LABEL_2': 'Neutral'
            }
            
            sentiment = label_mapping.get(best_result['label'].upper(), best_result['label'])
            
            # Extract key topics (simple keyword extraction)
            words = text.lower().split()
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
            key_words = [word.strip('.,!?";') for word in words if len(word) > 4 and word not in stop_words]
            key_topics = list(set(key_words[:5]))  # Get unique top 5 keywords
            
            if not key_topics:
                key_topics = ['General', 'News', 'Article']

            # Generate summary based on sentiment
            if sentiment == 'Positive':
                summary = "The article expresses a positive sentiment with optimistic tone and favorable language."
            elif sentiment == 'Negative':
                summary = "The article expresses a negative sentiment with critical or pessimistic tone."
            else:
                summary = "The article maintains a neutral tone with balanced and objective language."

            return {
                'label': sentiment,
                'score': round(best_result['score'], 4),
                'sentiment': sentiment,
                'confidence': round(best_result['score'] * 100, 1),
                'keyTopics': key_topics,
                'summary': summary,
                'all_scores': [
                    {
                        'label': label_mapping.get(result['label'].upper(), result['label']),
                        'score': round(result['score'], 4)
                    }
                    for result in results
                ],
                'text_length': len(text),
                'word_count': len(text.split())
            }

        except Exception as e:
            logger.error(f"Error during classification: {e}")
            raise RuntimeError(f"Classification failed: {e}")

