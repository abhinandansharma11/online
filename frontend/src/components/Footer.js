import React from "react";
import "./Footer.css";

const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>© {year} NiteBite • All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
