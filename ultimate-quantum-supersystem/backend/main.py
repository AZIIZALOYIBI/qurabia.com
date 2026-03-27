from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from .quantum_agi_engine import run_integration_test

app = FastAPI(title='Ultimate Quantum SuperSystem API')

app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_methods=['*'], allow_headers=['*'])

class QueryIn(BaseModel):
    prompt: str

@app.get('/health')
async def health():
    return {'status':'ok'}

@app.post('/query')
async def query(inp: QueryIn):
    # echo endpoint placeholder — integrate AGI engine as needed
    return {'reply': f'ECHO: {inp.prompt}'}

@app.get('/', response_class=HTMLResponse)
async def ui():
    html = '''<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>Quantum AGI</title></head><body>
    <h3>Quantum AGI Engine</h3>
    <form id="f"><input id="q" placeholder="اكتب استعلاماً" style="width:60%"/></form>
    <pre id="out"></pre>
    <script>
    document.getElementById('f').addEventListener('submit', async e=>{e.preventDefault(); const q=document.getElementById('q').value; const r=await fetch('/query',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:q})}); const j=await r.json(); document.getElementById('out').textContent=JSON.stringify(j,null,2)});
    </script></body></html>'''
    return HTMLResponse(content=html)
