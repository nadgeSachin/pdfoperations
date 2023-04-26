import React from 'react';
import Merger from "./components/Merger";
import DeletePages from './components/DeletePage';
import Home from "./components/Home";
import Navbar from "./components/Navbar"
import Upload from './components/Upload';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'

const App = () => {
 

  return (
    <div>
      <BrowserRouter>
      <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/download" element={<Merger />} />
          <Route path="/delete-pages" element={<DeletePages />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

