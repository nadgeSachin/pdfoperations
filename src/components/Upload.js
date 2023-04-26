
import axios from "axios";
import React, { useRef, useState } from "react";
import './Upload.css';
import { useLocation, useNavigate } from 'react-router-dom';

const Upload = () => {
  const location = useLocation();
  const from = location.state && location.state.from;

  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleBrowseFile = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    const filesArray = Array.from(files);
    setSelectedFiles(filesArray);
  };

  const handlePDF = async (event) => {
    event.preventDefault();
    const formData = new FormData();
  
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append("file", selectedFiles[i]);
    }
  
    setUploading(true); 
    try {
      let response;
      if (from === 'merge') {
        response = await axios.post("http://localhost:5000/merge", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        });
      }
      if (from === 'delete'){
        navigate("/delete-pages",{state:{selectedFiles}});
      }

      if (from === 'image'){
        response = await axios.post("http://localhost:5000/imagepdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        });
      }

      if (from === 'imagetext'){
        response = await axios.post("http://localhost:5000/docxpdf", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        });
      }
  
      if (response && response.status === 200) {
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        setUploading(false); 
        navigate('/download', { state: { url: url } });
      } else {
        setUploading(false);
      }
    } catch (error) {
      console.log(error);
    //   setMsg("Failed to upload. Please try again.");
      setUploading(false); // Set uploading state to false after error response
    }
  };
  

  return (
    <>
      <div className="container">
        <div className="drag-area">
          <div className="icon">
            <i className="fa fa-cloud-upload-alt"></i>
          </div>
          <header>Drag & Drop to Upload File</header>
          <span>OR</span>
          {selectedFiles.length >= 1 ? (
            <>
                {uploading ? (
                <button disabled>Loading...</button>
                ) : (
                <>
                    { from === 'merge'&&(
                    <button onClick={handlePDF}>Merge PDF</button>
                    )} 
                    {from === 'delete'&&(
                    <button onClick={handlePDF}>Delete Pages </button>
                    )}
                    {from === 'image' && (
                      <button onClick={handlePDF}>Image to PDF </button>
                    )}
                    {from === 'imagetext' && (
                      <button onClick={handlePDF}>Image to Text </button>
                    )}
                </>
                )}
            </>
            ) : (
            <button onClick={handleBrowseFile}>Browse Files</button>
            )}
          <input type="file" name="file" hidden multiple ref={fileInputRef}
            onChange={handleFileChange} />
        </div>
      </div>
    </>
  );
};

export default Upload;
