from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # Add this import
from spleeter.separator import Separator
import os
from pathlib import Path
import atexit
from multiprocessing import Pool, cpu_count

# Disable GPU if not available
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# Initialize FastAPI app
app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")  # Add this line

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (update this for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Spleeter separator (2 stems: vocals and accompaniment)
separator = Separator("spleeter:2stems")

# Define the output directory for separated audio files
OUTPUT_DIR = "static/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Create a multiprocessing pool
pool = Pool(processes=cpu_count())

# Cleanup function to terminate the pool
def cleanup():
    print("Cleaning up multiprocessing pool...")
    pool.close()
    pool.join()

# Register the cleanup function
atexit.register(cleanup)

@app.post("/upload/")
async def upload(file: UploadFile = File(...)):
    try:
        # Sanitize filename to prevent issues
        safe_filename = file.filename.replace(" ", "_")  # Replace spaces with underscores
        file_path = os.path.join(OUTPUT_DIR, safe_filename)
        
        # Save the uploaded file temporarily
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Separate the audio using Spleeter
        separator.separate_to_file(file_path, OUTPUT_DIR)

        # Generate the output file paths
        base_name = Path(safe_filename).stem  # Use sanitized filename
        output_folder = os.path.join(OUTPUT_DIR, base_name)
        
        # Ensure output folder exists before returning URLs
        if not os.path.exists(output_folder):
            raise HTTPException(status_code=500, detail="Audio separation failed, output not found.")
        
        # Ensure the files exist
        if not os.path.exists(os.path.join(output_folder, "vocals.wav")) or not os.path.exists(os.path.join(output_folder, "accompaniment.wav")):
            raise HTTPException(status_code=500, detail="Audio separation failed, output files not found.")
        
        # Return the correct static file paths
        output_files = {
    "vocals": f"/static/output/{base_name}/vocals.wav".replace("\\", "/"),
    "accompaniment": f"/static/output/{base_name}/accompaniment.wav".replace("\\", "/"),
}


        # Return the response
        return JSONResponse(
            content={
                "status": "success",
                "message": "Audio separation completed successfully",
                "output_files": output_files,
            }
        )
    except Exception as e:
        # Handle errors and return a 500 status code
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred during audio separation: {str(e)}",
        )

# Run the application
if __name__ == "__main__":
    import uvicorn
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except KeyboardInterrupt:
        print("Server stopped by user")
    finally:
        print("Cleaning up resources...")
        cleanup()  # Call the cleanup function