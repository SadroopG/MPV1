from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import shutil
from spleeter.separator import Separator

# Disable GPU
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Specify the path to FFmpeg binary
os.environ['FFMPEG_BINARY'] = r'C:\ffmpeg\ffmpeg_2025\bin'

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from your React frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

UPLOAD_DIR = "uploads/"
OUTPUT_DIR = "static/output/"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

separator = Separator('spleeter:2stems')  # 2-stem model

# Mount static files to serve processed audio
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/upload/")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process the audio file
    separator.separate_to_file(file_path, OUTPUT_DIR)
    
    # Get the output files
    output_folder = os.path.join(OUTPUT_DIR, os.path.splitext(file.filename)[0])
    output_files = [f"/static/output/{os.path.splitext(file.filename)[0]}/{f}" for f in os.listdir(output_folder) if f.endswith(".wav")]
    
    #Logging 
    print("Generated output files:", output_files)
    
    return {"message": "File processed", "download_files": output_files}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
