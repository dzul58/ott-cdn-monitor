import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Parent = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default Parent;