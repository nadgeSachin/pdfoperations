import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import './DeletePages.css';
import axios from "axios";
import { useLocation, useNavigate } from 'react-router-dom';

function DeletePage() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null); // Change initial state to null
  const [selectedPages, setSelectedPages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const selectedFiles = location.state && location.state.selectedFiles;
    if (selectedFiles && selectedFiles.length > 0) {
      setFile(selectedFiles[0]); // Access first file from the selectedFiles array
    }
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offSet) {
    setPageNumber(prevPageNumber => prevPageNumber + offSet);
  }

  function handlePageClick(event, pageNumber) {
    // Check if the selected page is already in the selectedPages array
    const isSelected = selectedPages.includes(pageNumber);
  
    if (isSelected) {
      // If the page is already selected, remove it from the array
      setSelectedPages(prevSelectedPages => prevSelectedPages.filter(page => page !== pageNumber));
    } else {
      // If the page is not selected, add it to the array
      setSelectedPages(prevSelectedPages => [...prevSelectedPages, pageNumber]);
    }
  
    // Apply CSS class to mark the selected page visually
    event.target.classList.toggle('selected-page');
  }
  

  useEffect(() => {
    console.log("You selected pages: ", selectedPages);
  }, [selectedPages]);

  const handleDeletePages = async (event) => {
    event.preventDefault();
    if (!file || file.length === 0) {
      console.log('No file selected');
      return;
    }
    const formData = new FormData();

    formData.append("file", file);
    formData.append("selectedPages", JSON.stringify(selectedPages));

    setUploading(true);
    try {
      let response;
      response = await axios.post("http://localhost:5000/deletepages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        setUploading(false);
        navigate('/download', { state: { url: url } });
      } else {
        setUploading(false);
      }
    } catch (error) {
      console.log(error);
      setUploading(false);

    }
  };

  return (
    <div className="App">
      <center>
        <div>
          <Document file={file} className="docs" onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(
              new Array(numPages),
              (el, index) => (
                <Page
                  className="pg"
                  height={200}
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  renderInteractiveForms={true}
                  renderMode="canvas"
                  onClick={(event) => handlePageClick(event, index + 1)} // Pass pageNumber as argument
                />
              )
            )}
          </Document>
        </div>
      </center>
      <button onClick={(event) => handleDeletePages(event)}>Delete Selected Pages</button>
    </div>
  );
}

export default DeletePage;
