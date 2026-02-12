import pandas as pd
import sys

def excel_to_csv(file_path):
    try:
        df = pd.read_excel(file_path)
        print(df.to_csv(index=False))
    except Exception as e:
        print(f"Error reading Excel file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        excel_to_csv(sys.argv[1])
    else:
        print("Usage: python read_excel.py <file_path>", file=sys.stderr)
        sys.exit(1)
