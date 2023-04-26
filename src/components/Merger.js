



import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import './Merger.css';

const Merger = () => {
  const [url, setUrl] = useState(null);
  const location = useLocation();
  const from = location.state && location.state.from;

  useEffect(() => {
    setUrl(location.state && location.state.url);
  }, []);

  const handleDownload = () => {
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    let fname="";
    if(from==="merge"){
      fname="merged.pdf";
    }
    if(from==="delete"){
      fname="deletedPages.pdf";
    }
    if(from==="image"){
      fname="image.pdf";
    }
    
    downloadLink.setAttribute("download", fname);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(url);
    window.location.reload();
  };

  return (
    <>
      <div className="container">
        <div className="drag-area">
          <h3>Welcome to ErrorLess PDF Extraction</h3>
          <button onClick={handleDownload}>Download Merged PDF</button>
        </div>
      </div>
    </>
  );
}

export default Merger;
