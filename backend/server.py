from flask import Flask, request, send_file,jsonify
import os
from PyPDF2 import  PdfFileMerger,PdfFileReader,PdfFileWriter
from flask_cors import CORS
import json  
from PIL import Image
from werkzeug.utils import secure_filename
import pytesseract
from docx2pdf import convert
from docx import Document
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate
import io
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import fitz
import gzip
from io import BytesIO


app = Flask(__name__)
CORS(app)
app.debug = True
app.config["UPLOAD_FOLDER"] = os.path.abspath("uploads")
app.config["OUTPUT_FOLDER"] = os.path.abspath("output_files")
app.config["DELETE_INPUT_FOLDER"] = os.path.abspath("delete_input")
app.config["DELETE_OUTPUT_FOLDER"] = os.path.abspath("delete_output")
app.config["IMAGE_INPUT_FOLDER"] = os.path.abspath("image_input")
app.config["IMAGE_OUTPUT_FOLDER"] = os.path.abspath("image_output")
app.config["IMAGETEXT_INPUT_FOLDER"] = os.path.abspath("imagetext_input")
app.config["IMAGETEXT_OUTPUT_FOLDER"] = os.path.abspath("imagetext_output")
app.config["DOCX_INPUT_FOLDER"] = os.path.abspath("docx_input")
app.config["DOCX_OUTPUT_FOLDER"] = os.path.abspath("docx_output")


@app.route("/merge", methods=["POST"])
def merge():
    files = request.files.getlist("file")
    merger = PdfFileMerger()
    for file in files:
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], file.filename))
        merger.append(file)

    output_file_path = os.path.join(app.config["OUTPUT_FOLDER"], "merged.pdf")
    with open(output_file_path, "wb") as output_file:
        merger.write(output_file)

    # return send_file(output_file_path, as_attachment=True)

    # Send the merged PDF file as a response to the client
    response = send_file(output_file_path, as_attachment=True)

    # Delete the uploaded files from the UPLOAD_FOLDER directory
    for file in files:
        os.remove(os.path.join(app.config["UPLOAD_FOLDER"], file.filename))

    # Delete the merged PDF file from the OUTPUT_FOLDER directory
    os.remove(output_file_path)

    return response

@app.route('/deletepages', methods=['POST'])
def deletepages():
    file = request.files['file']
    selected_pages = json.loads(request.form['selectedPages'])
    
    # Save the uploaded file to delete_input folder
    file_path = os.path.join(app.config["DELETE_INPUT_FOLDER"], file.filename)
    file.save(file_path)

    # Load the PDF file
    pdf_reader = PdfFileReader(file_path,'rb')

    # Create a new PDF writer object
    pdf_writer = PdfFileWriter()

    print('number of pages: ', str(pdf_reader.getNumPages()))
    print("Deleting pages: " , selected_pages)

    # Iterate through the pages in the PDF and add them to the writer, skipping the selected pages
    for page_num in range(pdf_reader.getNumPages()):
        if str(page_num + 1) not in map(str, selected_pages):
            pdf_writer.addPage(pdf_reader.getPage(page_num))

    # Create the output file path in delete_output folder
    output_file_path = os.path.join(app.config["DELETE_OUTPUT_FOLDER"], "modified.pdf")

    # Write the modified PDF to the output file
    with open(output_file_path, "wb") as output_file:
        pdf_writer.write(output_file)

    # print("Success")
    # return send_file(output_file_path, as_attachment=True)

    # Send the modified PDF file as a response to the client
    response = send_file(output_file_path, as_attachment=True)

    # Delete the input and output files
    os.remove(file_path)
    os.remove(output_file_path)

    return response

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Function to check if a file has an allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/imagepdf", methods=["POST"])
def imagepdf():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file found in the request.'}), 400

        files = request.files.getlist('file')
        filenames = []
        images = []
        # Loop through each file and save it in the "image_input" folder
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join('image_input', filename))
                filenames.append(filename)
                img = Image.open(file)
                images.append(img.convert("RGB"))
        output_file_path = os.path.join(app.config["IMAGE_OUTPUT_FOLDER"], "output.pdf")
        images[0].save(output_file_path, save_all=True, append_images=images[1:])
        with open(output_file_path, "rb") as file:
            pdf_data = file.read()
        # return send_file(output_file_path, as_attachment=True)

        # Send the output PDF file as a response to the client
        response = send_file(output_file_path, as_attachment=True)
        
        # Delete the input image files and output PDF file
        for filename in filenames:
            os.remove(os.path.join('image_input', filename))
        os.remove(output_file_path)

        return response

    except Exception as e:
        # Log the error for troubleshooting
        print("Error creating PDF: ", str(e))
        return jsonify({"error": "Failed to create PDF"}), 500

def extract_text_and_create_pdf(image):
    # Perform OCR
    text = pytesseract.image_to_string(image)

    # Create a PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)

    # Paste the extracted text into the PDF
    pdf.multi_cell(0, 10, text)

    # Save the PDF
    pdf_path = os.path.join(app.config['IMAGETEXT_OUTPUT_FOLDER'], 'output.pdf')
    pdf.output(pdf_path)

    return pdf_path


@app.route('/imagetext1', methods=['POST'])
def upload():
    try:
        # Check if file is present in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file found in the request.'}), 400

        file = request.files['file']

        # Check if file has allowed extension
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['IMAGETEXT_INPUT_FOLDER'], filename)
            file.save(file_path)

            # Open the image and extract text
            image = Image.open(file_path)
            pdf_path = extract_text_and_create_pdf(image)

            # Return the PDF file as a download
            return send_file(pdf_path, as_attachment=True)
        else:
            return jsonify({'error': 'Invalid file format.'}), 400
    except Exception as e:
        # Log the error for troubleshooting
        print("Error processing image: ", str(e))
        return jsonify({"error": "Failed to process image"}), 500

@app.route('/imagetext', methods=['POST'])
def imagetext():
    try:
        # Check if file is present in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file found in the request.'}), 400

        # Get the uploaded file from the request
        file = request.files['file']
        input_path = os.path.join(app.config["DOCX_INPUT_FOLDER"], file.filename)
        file.save(input_path)    
        output_path = os.path.join(app.config['DOCX_OUTPUT_FOLDER'], 'output.pdf')
         # Convert the Word document to PDF
        convert(input_path, output_path)
    
        # Return the converted PDF file
        return send_file(output_path, as_attachment=True)
    except Exception as e:
        # Log the error for troubleshooting
        print("Error converting Word to PDF: ", str(e))
        return jsonify({"error": "Failed to convert Word to PDF"}), 500


@app.route("/docxpdf", methods=["POST"])
def docxpdf():
    file = request.files["file"]
    # Open the original PDF file
    pdf_doc = fitz.open("assignments.pdf")

    # Get the first page
    page = pdf_doc.load_page(0)

    # Extract the content of the page
    page_content = page.get_text("text")

    # Compress the page content using gzip compression
    compressed_content = gzip.compress(page_content.encode())

    # Create a new PDF page with the compressed content
    new_page = pdf_doc.new_page(width=page.MediaBoxSize[0], height=page.MediaBoxSize[1])
    new_page.insert_text(fitz.Point(0, 0), compressed_content.decode())

    # Save the compressed PDF
    output_file = "output.pdf"
    pdf_doc.save(output_file)

    # Close the PDF
    pdf_doc.close()

    # Return the compressed PDF as a file attachment
    return jsonify({'success': 'No file found in the request.'}), 200


if __name__ == "__main__":
    app.run()