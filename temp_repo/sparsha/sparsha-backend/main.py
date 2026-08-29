from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import gdm, dysarthria

app = FastAPI(
    title="SPARSHA.AI Backend",
    description="ML inference API for GDM and Dysarthria risk prediction",
    version="1.0.0",
)

# Allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # local dev
        "https://your-site.vercel.app" # production — update this
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gdm.router,        prefix="/predict", tags=["GDM"])
app.include_router(dysarthria.router, prefix="/predict", tags=["Dysarthria"])

@app.get("/health")
def health():
    return {"status": "ok", "message": "SPARSHA.AI backend is running"}