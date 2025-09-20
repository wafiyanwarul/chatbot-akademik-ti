from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time

app = FastAPI()

# CORS: izinkan akses dari file:// atau localhost (UI kamu)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # boleh dibatasi ke ["http://127.0.0.1:5500", "http://localhost:5500"] dst.
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatReq(BaseModel):
    query: str

@app.get("/api/health")
def health():
    return {"status": "ok", "ts": int(time.time())}

@app.post("/api/chat")
def chat(req: ChatReq):
    # TODO: nanti ganti ke (retriever -> reader) RAG pipeline kamu
    answer = f"(Mock) Saya menerima pertanyaan: '{req.query}'. Pipeline RAG menyusul."
    sources = [
        {"title": "Website Prodi TI", "url": "https://informatika.uin-malang.ac.id", "snippet": "Profil Prodi TI UIN Malang..."}
    ]
    return {"answer": answer, "sources": sources, "usage": {"latency_ms": 1234}}
