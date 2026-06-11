# backend/main.py
import os
import re
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai

app = FastAPI()

# Enable Cross-Origin Resource Sharing (CORS) for smooth frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SECURE CREDENTIAL LOADING: Pulls safely from system environment variables during cloud 
# deployment, using your active testing key locally as a fallback parameter block.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyDbuZ3zQfBwjHPPZ8OvvPAH9Hd0Z7KPYhI")

client = genai.Client(api_key=GEMINI_API_KEY)

# Central memory validation cache dictionary
AI_SUMMARY_CACHE = {}

# UPGRADED REGEX: Simultaneously parses Python structures and C/C++ native file includes
IMPORT_REGEX = re.compile(r"^\s*(?:import\s+([a-zA-Z0-9_]+)|from\s+([a-zA-Z0-9_]+)|#include\s+[\"<]([a-zA-Z0-9_\.]+).*)")

# COMPLEXITY REGEX: Quantifies logic decision weight density to compute structural scoring
COMPLEXITY_REGEX = re.compile(r"\b(if|elif|for|while|def|class|switch|case|void|int|float)\b")

def analyze_directory(repo_path: str):
    # Adaptive Cloud Path Routing: If the user searches for the repository name or 
    # 'backend', point it directly to the server's active root working directory ('.')
    target_path = repo_path.strip()
    if target_path.lower() in ["backend", "repo-visualizer", "test_repo"]:
        target_path = "."

    if not os.path.exists(target_path):
        raise HTTPException(status_code=404, detail=f"Directory path not found: {repo_path}")
        
    file_nodes = []
    internal_modules = set()

    # Supported multi-language extensions based on the problem statement requirements
    valid_extensions = (".py", ".c", ".cpp", ".h", ".hpp")

    # Pass 1: Trace repository tree, build lookups, extract complexity metrics
    for root, dirs, files in os.walk(target_path):
        # Skip virtual environments and temporary directories to clean up visualization clutter
        if any(v in root for v in ["venv", ".venv", "__pycache__", "node_modules", "dist"]):
            continue
            
        for file in files:
            if file.endswith(valid_extensions):
                full_path = os.path.join(root, file).replace("\\", "/")
                
                # Strip out formatting string fragments for structured matching keys
                filename_without_ext = os.path.splitext(file)[0]
                internal_modules.add(filename_without_ext)
                internal_modules.add(file) 
                
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()
                    
                    loc = len(lines)
                    imports = []
                    complexity_score = 0
                    
                    for line in lines:
                        # Process logic statements to scale file density metrics
                        complexity_score += len(COMPLEXITY_REGEX.findall(line))
                        
                        # Match language specific import frameworks
                        match = IMPORT_REGEX.match(line)
                        if match:
                            imported_module = match.group(1) or match.group(2) or match.group(3)
                            if imported_module:
                                clean_mod = os.path.splitext(imported_module)[0]
                                if clean_mod not in imports:
                                    imports.append(clean_mod)
                    
                    display_complexity = max(1, complexity_score)

                    file_nodes.append({
                        "path": full_path,
                        "filename": file,
                        "module_name": filename_without_ext,
                        "loc": loc,
                        "complexity": display_complexity,
                        "imports": imports
                    })
                except Exception as e:
                    print(f"Error reading {full_path}: {e}")
                    continue

    # Pass 2: Filter architectural scopes & draw clean edge connectors
    edges = []
    edge_counter = 1
    
    for current_file in file_nodes:
        for imported_mod in current_file["imports"]:
            if imported_mod in internal_modules:
                for target_file in file_nodes:
                    if current_file["path"] != target_file["path"] and (imported_mod == target_file["module_name"] or imported_mod == target_file["filename"]):
                        edges.append({
                            "id": f"e-{edge_counter}",
                            "source": current_file["path"],  
                            "target": target_file["path"],
                            "markerEnd": {
                                "type": "arrowclosed",
                                "color": "#555"
                            },
                            "style": {
                                "stroke": "#555",
                                "strokeWidth": 2
                            }
                        })
                        edge_counter += 1

    return {"nodes": file_nodes, "edges": edges}


@app.get("/analyze")
def get_repository_analysis(path: str):
    if not path:
        raise HTTPException(status_code=400, detail="Path parameter is required")
    return analyze_directory(path)


@app.get("/summary")
def get_file_summary(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            code_content = f.read()
        
        # Calculate content cryptographic signatures to block redundant API expenditure
        file_hash = hashlib.md5(code_content.encode("utf-8")).hexdigest()
        
        if path in AI_SUMMARY_CACHE:
            cached_data = AI_SUMMARY_CACHE[path]
            if cached_data["hash"] == file_hash:
                print(f"--> [CACHE HIT] Serving saved execution summary for: {path}")
                return {"summary": cached_data["summary"], "cached": True}
        
        print(f"--> [CACHE MISS] Querying fresh cloud parsing block from Gemini for: {path}")
        
        prompt = f"You are an expert code analyst. Explain what this code does in exactly 3 simple sentences:\n\n{code_content}"
        
        # CORRECTED METHOD CALL: Standardized parameter keys mapping for 'google-genai' schema
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        ai_text = response.text
        
        # Lock payload to client dictionary cache
        AI_SUMMARY_CACHE[path] = {
            "hash": file_hash,
            "summary": ai_text
        }
        
        return {"summary": ai_text, "cached": False}
        
    except Exception as e:
        print(f"Gemini API Execution Failure Detail: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")