# PDF to JSON Conversion Integration

This integration adds PDF to JSON conversion functionality to the Upload page using the EstimateX PDF2JSON project.

## Features

- **PDF Upload**: Upload PDF files through the existing upload interface
- **Convert to JSON**: Convert uploaded PDFs to structured JSON format
- **Extract Metadata**: Include PDF metadata (title, author, dates, etc.)
- **Extract Tables**: Detect and extract tables from PDFs
- **Download Results**: Download the converted JSON files
- **Visual Feedback**: Real-time conversion progress and results

## Installation

### 1. Install Python Dependencies

```bash
cd /Users/rahulchaudhary/project2
pip3 install -r pdf_requirements.txt
```

Or manually:

```bash
pip3 install PyMuPDF
```

### 2. Verify Python Script

The PDF converter script is located at:

```
/Users/rahulchaudhary/project2/scripts/pdf_converter.py
```

Test it:

```bash
python3 scripts/pdf_converter.py --help
```

### 3. Configure Python Path (Optional)

If your Python is not at `python3`, set the environment variable:

```bash
# In .env file
PYTHON_PATH=/path/to/your/python3
```

## Usage

### Frontend (Upload Page)

1. Navigate to `/upload` in the dashboard
2. Upload a PDF file using drag-and-drop or file browser
3. After upload, click "Convert to JSON" button next to PDF files
4. Wait for conversion (shows progress spinner)
5. Once converted, click "Download JSON" to get the results

### Backend API

#### Convert PDF to JSON

**Endpoint**: `POST /api/pdf/convert`

**Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):

```javascript
{
  file: <PDF File>,
  includeMetadata: true,  // optional, default: false
  extractTables: true     // optional, default: false
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "originalFilename": "document.pdf",
    "totalPages": 5,
    "jsonFilename": "document.json",
    "data": {
      "source": "document.pdf",
      "total_pages": 5,
      "pages": [
        {
          "page_number": 1,
          "width": 612,
          "height": 792,
          "text": "Page content...",
          "blocks": [...],
          "tables": [...]
        }
      ]
    }
  },
  "message": "PDF converted successfully"
}
```

#### Download JSON File

**Endpoint**: `GET /api/pdf/download/:filename`

**Headers**:

```
Authorization: Bearer <token>
```

**Response**: File download

## File Structure

```
project2/
├── src/
│   ├── routes/
│   │   └── pdfRoutes.js          # API routes for PDF conversion
│   └── services/
│       └── pdfConverter.js       # PDF conversion service
├── scripts/
│   └── pdf_converter.py          # Python script for PDF processing
├── public/dashboard-app/src/
│   └── components/
│       └── Upload.jsx            # Updated upload component
├── pdf_requirements.txt          # Python dependencies
└── uploads/pdfs/                 # Uploaded and converted files
```

## Architecture

### Backend Flow

1. **Upload**: User uploads PDF through `/api/pdf/convert`
2. **Save**: File saved to `uploads/pdfs/`
3. **Convert**: Node.js calls Python script via child_process
4. **Process**: Python uses PyMuPDF to extract PDF content
5. **Return**: JSON result returned to client
6. **Store**: JSON file saved alongside PDF

### Frontend Flow

1. **Upload**: User drags/selects PDF file
2. **Display**: File appears in "Recent Uploads" list
3. **Convert**: User clicks "Convert to JSON" button
4. **Request**: POST to `/api/pdf/convert` with FormData
5. **Progress**: Shows spinner during conversion
6. **Success**: Displays success message with page count
7. **Download**: User can download JSON file

## PDF Conversion Details

### What Gets Extracted

#### Basic Text

- Plain text content from each page
- Preserves page structure

#### Text Blocks (with positions)

- Text with bounding box coordinates (x, y, width, height)
- Font information (name, size)
- Useful for layout-aware processing

#### Tables (if enabled)

- Detected table structures
- Row and column data
- Table positions

#### Metadata (if enabled)

- Title
- Author
- Subject
- Creator/Producer
- Creation and modification dates

### Example JSON Output

```json
{
  "success": true,
  "source": "construction_plan.pdf",
  "total_pages": 3,
  "metadata": {
    "title": "Construction Plan",
    "author": "John Doe",
    "creation_date": "2024-01-15"
  },
  "pages": [
    {
      "page_number": 1,
      "width": 612,
      "height": 792,
      "text": "Full page text content...",
      "blocks": [
        {
          "text": "Header Text",
          "bbox": [50, 50, 200, 75],
          "font": "Arial-Bold",
          "size": 24
        }
      ],
      "tables": [
        {
          "index": 0,
          "rows": [
            ["Item", "Quantity", "Rate"],
            ["Cement", "100 bags", "₹450"]
          ],
          "row_count": 2,
          "col_count": 3
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Python Script Errors

**Error**: `PyMuPDF not installed`

```bash
pip3 install PyMuPDF
```

**Error**: `Python script not found`

- Check path: `/Users/rahulchaudhary/project2/scripts/pdf_converter.py`
- Ensure file has execute permissions: `chmod +x scripts/pdf_converter.py`

**Error**: `Python command not found`

- Set `PYTHON_PATH` environment variable
- Or update `pdfConverter.js` line 7 with your Python path

### API Errors

**Error**: `401 Unauthorized`

- Ensure you're logged in
- Check token in localStorage

**Error**: `Only PDF files are allowed`

- Verify file has `.pdf` extension
- Check MIME type is `application/pdf`

**Error**: `File size too large`

- Current limit: 100MB
- Adjust in `pdfRoutes.js` line 30

### Frontend Errors

**Error**: Convert button not showing

- Ensure file type is `application/pdf`
- Check file extension is `.pdf`

**Error**: Conversion stuck

- Check browser console for errors
- Verify backend is running
- Check Python script works: `python3 scripts/pdf_converter.py test.pdf`

## Future Enhancements

### Planned Features

- [ ] DSR rate matching integration
- [ ] Cost estimation from converted PDFs
- [ ] Batch PDF conversion
- [ ] PDF preview before conversion
- [ ] Conversion history and management
- [ ] OCR for scanned PDFs
- [ ] Export to other formats (CSV, Excel)

### Integration with EstimateX DSR Matching

The PDF2JSON project includes DSR (Detailed Schedule of Rates) matching for construction cost estimation. To enable this:

1. Copy DSR database from temp_pdf2json:

```bash
cp temp_pdf2json/data/reference/DSR_combined.db uploads/pdfs/
```

2. Create DSR matching endpoint (future)
3. Add "Calculate Costs" button after conversion
4. Display cost breakdown from DSR matching

## Testing

### Manual Testing

1. **Test PDF Upload**:

```bash
# Use a test PDF
curl -X POST http://localhost:3000/api/pdf/convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.pdf" \
  -F "includeMetadata=true" \
  -F "extractTables=true"
```

2. **Test Python Script**:

```bash
python3 scripts/pdf_converter.py test.pdf --include-metadata true --extract-tables true
```

### Expected Behavior

- PDF uploads successfully
- Convert button appears for PDF files
- Conversion completes within seconds (depends on PDF size)
- JSON download works
- Converted JSON has proper structure

## Cleanup

To remove the temporary clone:

```bash
rm -rf temp_pdf2json
```

## Support

For issues related to:

- **PDF conversion**: Check Python script and PyMuPDF installation
- **API endpoints**: Check backend logs and routes
- **Frontend**: Check browser console and network tab
- **EstimateX features**: See [PDF2JSON repository](https://github.com/Rahulcdry07/PDF2JSON)

## License

This integration uses:

- **EstimateX/PDF2JSON**: MIT License
- **PyMuPDF**: AGPL-3.0 License
