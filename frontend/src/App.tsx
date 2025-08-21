import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LayoutDefault from "./layouts/LayoutDefault/LayoutDefault";
import MyDrive from "./pages/MyDrive/MyDrive";
import Recent from "./pages/Recent/Recent";
import Starred from "./pages/Starred/Starred";
import Trash from "./pages/Trash/Trash";

function App() {
  return (
    <BrowserRouter>
      <LayoutDefault>
        <Routes>
          <Route path="/" element={<MyDrive />} />
          <Route path="/recentes" element={<Recent />} />
          <Route path="/favoritos" element={<Starred />} />
          <Route path="/lixeira" element={<Trash />} />
        </Routes>
      </LayoutDefault>
    </BrowserRouter>
  )
}

export default App;