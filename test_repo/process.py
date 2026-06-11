# test_repo/process.py
import os          # External library (FastAPI backend will filter this out!)
import fastapi     # External library (FastAPI backend will filter this out!)
import utils       # Internal file module (FastAPI backend will draw an edge to utils.py!)

def run_pipeline():
    """
    A simple pipeline function that takes a messy string,
    calls our internal utils module to clean it up, and prints it.
    """
    raw_data = "  Some Text  "
    
    # Utilizing the function imported from utils.py
    clean_data = utils.clean_text(raw_data)
    
    print(clean_data)

if __name__ == "__main__":
    run_pipeline()