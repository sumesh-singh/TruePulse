
from flask import Blueprint, jsonify, current_app
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    app = current_app
    classifier = app.config.get('classifier')
    try:
        loaded = False
        model_status = "not loaded"
        if classifier is not None:
            try:
                loaded = getattr(classifier, "classifier", None) is not None
                model_status = "loaded" if loaded else "not loaded"
            except Exception as e:
                app.logger.error(f"Error checking classifier.classifier: {e}")
                loaded = False
                model_status = "not loaded"
        else:
            loaded = False
            model_status = "not loaded"
        
        status = "healthy" if loaded else "degraded"
        return jsonify({
            "status": status,
            "model_status": model_status,
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        app.logger.error(f"Health check endpoint failed: {e}")
        return jsonify({
            "status": "degraded",
            "model_status": "not loaded",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }), 200
