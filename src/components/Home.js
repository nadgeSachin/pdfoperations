
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

const Home = () => {
  const navigate = useNavigate();

  const mergePdf = () => {
    navigate('/upload', { state: { from: 'merge' } });
  };

  const deletePage = () => {
    navigate('/upload', { state: { from: 'delete' } });
  };

  const imagePDF = () => {
    navigate('/upload', { state: { from: 'image' } });
  };
  const imageText = () => {
    navigate('/upload', { state: { from: 'imagetext' } });
  };

  return (
    <>
      <button onClick={mergePdf} className="merge-btn">
        Merge PDFs
      </button>
      <button onClick={deletePage} className="merge-btn">
        Delete PDF Page
      </button>
      <button onClick={imagePDF} className="merge-btn">
        Image to PDF
      </button>
      <button onClick={imageText} className="merge-btn">
        Image to Text
      </button>
    </>
  );
};

export default Home;
