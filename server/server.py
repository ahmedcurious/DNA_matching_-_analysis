from fastapi import FastAPI, HTTPException, UploadFile, File
import pandas as pd
import numpy as np
from math import prod
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# DNA Matching functions
def hamming_distance(seq1, seq2):
    min_length = min(len(seq1), len(seq2))
    distance = sum(base1 != base2 for base1, base2 in zip(seq1[:min_length], seq2[:min_length]))
    distance += abs(len(seq1) - len(seq2))
    return distance

def percent_match(seq1, seq2):
    max_length = max(len(seq1), len(seq2))
    if max_length == 0:
        return 100.0
    distance = hamming_distance(seq1, seq2)
    return ((max_length - distance) / max_length) * 100

def find_best_match(target_seq: str, excel_file_path: str):
    df = pd.read_excel(excel_file_path)
    if 'Name' not in df.columns or 'Sequence' not in df.columns:
        raise ValueError("Excel file must contain 'Name' and 'Sequence' columns")

    best_match_name = None
    best_match_percentage = 0

    for _, row in df.iterrows():
        name = row['Name']
        sequence = row['Sequence']
        match_percentage = percent_match(target_seq, sequence)

        if match_percentage > best_match_percentage:
            best_match_name = name
            best_match_percentage = match_percentage

    return best_match_name, best_match_percentage

# DNA Analysis functions
def calculate_rmp(allele_frequencies):
    rmp = []
    for locus in allele_frequencies:
        rmp_locus = sum(f**2 for f in locus)
        rmp.append(rmp_locus)
    return prod(rmp)

def calculate_cpi(allele_frequencies):
    cpi = []
    for locus in allele_frequencies:
        inclusion_prob = 1 - sum(f**2 for f in locus)
        cpi.append(inclusion_prob)
    return prod(cpi)

def calculate_pi(obligate_allele_freq, theta=0.01):
    return obligate_allele_freq / (theta + (1 - theta) * obligate_allele_freq)

def calculate_kinship_lr(shared_allele_probs, unrelated_probs):
    return prod(shared_allele_probs) / prod(unrelated_probs)

def calculate_sibling_index(shared_allele_probs):
    sibling_index = []
    for p in shared_allele_probs:
        sibling_index.append((2 * p**2) / (2 * p + (1 - p)**2))
    return prod(sibling_index)

# Path to the preloaded Excel file
EXCEL_FILE_PATH = "../dna_database.xlsx"

# Default allele frequencies
DEFAULT_ALLELE_FREQUENCIES = [[0.2, 0.8], [0.5, 0.5], [0.3, 0.7]]

@app.post("/dna_matching")
async def dna_matching(target_sequence: UploadFile = File(...), excel_file: UploadFile = File(None)):
    try:
        # Read the uploaded DNA sequence
        target_seq = (await target_sequence.read()).decode("utf-8").strip()

        # Use provided Excel file or the preloaded Excel file
        if excel_file:
            excel_data = await excel_file.read()
            excel_file_path = "/tmp/temp_excel_file.xlsx"
            with open(excel_file_path, "wb") as f:
                f.write(excel_data)
        else:
            excel_file_path = EXCEL_FILE_PATH

        # DNA Matching
        best_match_name, best_match_percentage = find_best_match(target_seq, excel_file_path)

        # DNA Analysis
        rmp = calculate_rmp(DEFAULT_ALLELE_FREQUENCIES)
        cpi = calculate_cpi(DEFAULT_ALLELE_FREQUENCIES)
        obligate_allele_freq = 0.3  # Example obligate allele frequency for PI
        pi = calculate_pi(obligate_allele_freq)
        shared_probs = [0.25, 0.25, 0.5]  # Example shared allele probabilities for Kinship LR
        unrelated_probs = [0.01, 0.01, 0.01]  # Example unrelated probabilities
        kinship_lr = calculate_kinship_lr(shared_probs, unrelated_probs)
        sibling_probs = [0.25, 0.25, 0.5]  # Example sibling allele probabilities
        fsi = calculate_sibling_index(sibling_probs)

        # Combine results
        return {
            "dna_matching": {
                "best_match_name": best_match_name,
                "best_match_percentage": best_match_percentage
            },
            "dna_analysis": {
                "rmp": rmp,
                "cpi": cpi,
                "pi": pi,
                "kinship_lr": kinship_lr,
                "fsi": fsi
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
