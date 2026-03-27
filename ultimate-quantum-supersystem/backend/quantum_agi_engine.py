from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify(status='ok')


@app.route('/query', methods=['POST'])
def query():
    data = request.get_json(silent=True) or {}
    q = data.get('query') or data.get('prompt') or ''
    # مؤقت: استجابة بسيطة (echo). استبدل بمنطق AGI لاحقاً.
    return jsonify({'input': q, 'response': f'ECHO: {q}'})


_SIMPLE_UI = '''
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Quantum AGI Engine — واجهة</title>
    <style>
      body{font-family: Tajawal, sans-serif;background:#060816;color:#eef3ff;padding:24px}
      input,textarea{width:100%;padding:8px;margin:8px 0;border-radius:6px;border:1px solid #334}
      button{background:#38f2ff;color:#062; padding:8px 16px;border-radius:6px;border:none;cursor:pointer}
      .card{background:rgba(255,255,255,0.02);padding:16px;border-radius:8px}
    </style>
  </head>
  <body>
    <h1>Quantum AGI Engine — واجهة اختبار</h1>
    <div class="card">
      <label>سؤال / مدخل:</label>
      <textarea id="prompt" rows="4"></textarea>
      <button id="send">إرسال</button>
    </div>
    <h2>الاستجابة</h2>
    <pre id="result" class="card">لا شيء بعد.</pre>

    <script>
      const send = document.getElementById('send')
      send.addEventListener('click', async () => {
        const prompt = document.getElementById('prompt').value
        const res = await fetch('/query', {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ query: prompt })
        })
        const data = await res.json()
        document.getElementById('result').textContent = JSON.stringify(data, null, 2)
      })
    </script>
  </body>
</html>
'''


@app.route('/', methods=['GET'])
def ui():
    return Response(_SIMPLE_UI, mimetype='text/html')


if __name__ == '__main__':
    # تشغيل محلي قابل للتطوير
    app.run(host='0.0.0.0', port=8000, debug=True)
