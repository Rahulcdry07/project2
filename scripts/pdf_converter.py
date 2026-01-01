#!/usr/bin/env python3
"""
PDF to JSON Converter Script
Simplified version of EstimateX converter for integration
"""

import sys
import json
import argparse
import warnings
import os
from pathlib import Path

# Suppress all warnings and redirect stderr to devnull to keep stdout clean
warnings.filterwarnings('ignore')
sys.stderr = open(os.devnull, 'w')

try:
    import fitz  # PyMuPDF
except ImportError:
    print(json.dumps({
        "error": "PyMuPDF not installed. Install with: pip install PyMuPDF",
        "success": False
    }))
    sys.exit(1)


def convert_pdf_to_json(pdf_path, include_metadata=False, extract_tables=False):
    """Convert PDF to JSON structure."""
    try:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            return {"error": f"PDF file not found: {pdf_path}", "success": False}

        doc = fitz.open(str(pdf_path))
        
        doc_data = {
            "success": True,
            "source": pdf_path.name,
            "total_pages": len(doc),
            "pages": []
        }

        # Add metadata if requested
        if include_metadata:
            doc_data["metadata"] = {
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creator": doc.metadata.get("creator", ""),
                "producer": doc.metadata.get("producer", ""),
                "creation_date": doc.metadata.get("creationDate", ""),
                "mod_date": doc.metadata.get("modDate", ""),
            }

        # Extract content from each page
        for page_num in range(len(doc)):
            page = doc[page_num]
            page_data = {
                "page_number": page_num + 1,
                "width": page.rect.width,
                "height": page.rect.height,
                "text": page.get_text("text"),
                "blocks": []
            }

            # Extract text blocks with positions
            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if "lines" in block:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            page_data["blocks"].append({
                                "text": span["text"],
                                "bbox": span["bbox"],
                                "font": span["font"],
                                "size": span["size"]
                            })

            # Extract tables if requested
            if extract_tables:
                tables = page.find_tables()
                if tables and tables.tables:
                    page_data["tables"] = []
                    for idx, table in enumerate(tables.tables):
                        try:
                            table_extract = table.extract()
                            if table_extract:
                                page_data["tables"].append({
                                    "index": idx,
                                    "rows": table_extract,
                                    "row_count": len(table_extract),
                                    "col_count": len(table_extract[0]) if table_extract else 0
                                })
                        except Exception:
                            continue

            doc_data["pages"].append(page_data)

        doc.close()
        return doc_data

    except Exception as e:
        return {"error": str(e), "success": False}


def main():
    parser = argparse.ArgumentParser(description="Convert PDF to JSON")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--include-metadata", default="false", help="Include PDF metadata")
    parser.add_argument("--extract-tables", default="false", help="Extract tables from PDF")
    parser.add_argument("--output", help="Output JSON file path (optional)")

    args = parser.parse_args()

    include_metadata = args.include_metadata.lower() == "true"
    extract_tables = args.extract_tables.lower() == "true"

    result = convert_pdf_to_json(args.pdf_path, include_metadata, extract_tables)

    # Save to file if output path provided
    if args.output and result.get("success"):
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

    # Print JSON to stdout for Node.js to capture
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
