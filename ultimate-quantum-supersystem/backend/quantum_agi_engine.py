from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/health', methods=['GET'])
def health():
    return jsonify(status='ok')


@app.route('/query', methods=['POST'])
def query():
    data = request.get_json(silent=True) or {}
    q = data.get('query') or data.get('prompt') or ''
    # مؤقت: نستجيب بصدى للسؤال. يمكنك استبدال هذه الوظيفة بمحرك AGI حقيقي لاحقاً.
    return jsonify({'input': q, 'response': f'ECHO: {q}'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
