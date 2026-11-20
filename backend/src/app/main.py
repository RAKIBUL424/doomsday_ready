from fastapi import FastAPI



app = FastAPI(title="Doomsday Ready")



@app.get("/health")
async def health():
    return {"status": "ok"}