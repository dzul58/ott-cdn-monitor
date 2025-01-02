import React from "react";
import { Outlet } from "react-router-dom";
// import Navbar from '../components/Navbar';

function Parent() {
  return (
    <div className="parent-container">
      {/* Header, Navigation, dll bisa ditambahkan di sini */}
      <main>
        <Outlet />
      </main>
      {/* Footer bisa ditambahkan di sini */}
    </div>
  );
}

export default Parent;
