from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": ["https://prop-a-bility.com","https://www.prop-a-bility.com"]}})

@app.route('/', methods=['GET'])
def home():
    return "Prop-a-bility Backend is Running!"

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "online",
        "host": "Raspberry Pi 5",
        "project": "Prop-a-bility"
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5050)
