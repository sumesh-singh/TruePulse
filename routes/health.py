
from flask import Blueprint, jsonify, current_app

health_bp = Blueprint('health_bp', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """
    Provides the health status of the application, including model load status.
    """
    classifier = current_app.config.get('classifier')
    
    if classifier and classifier.is_model_loaded():
        model_status = "Model loaded"
    else:
        model_status = "Model not loaded"
        
    return jsonify({
        "status": "ok",
        "model_status": model_status
    })
