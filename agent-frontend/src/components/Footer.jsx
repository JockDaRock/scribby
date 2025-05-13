import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-6 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">
              &copy; {currentYear} Scribby. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-6">
            {/* Using buttons instead of empty links for better accessibility */}
            <button 
              className="text-gray-300 hover:text-white transition"
              aria-label="Terms of Service"
            >
              Terms
            </button>
            <button 
              className="text-gray-300 hover:text-white transition"
              aria-label="Privacy Policy"
            >
              Privacy
            </button>
            <button 
              className="text-gray-300 hover:text-white transition"
              aria-label="Contact Us"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;