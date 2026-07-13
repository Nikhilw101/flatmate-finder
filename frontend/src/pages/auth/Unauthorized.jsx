import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="hero-title mb-4">403</h1>
        <h2 className="sec-title mb-6">Access Denied</h2>
        <p className="sec-desc mb-8">You don't have permission to view this page.</p>
        <Link to="/" className="btn btn-primary">Return Home</Link>
      </div>
    </div>
  );
}
