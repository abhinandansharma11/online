import React from "react";
import "./MeetCreators.css";

const creators = [
  {
    name: "ARK  SHREE",
    roll: "23CD3010",
    border: "yellow-glow-border",
    img: "https://res.cloudinary.com/djdcwwpbl/image/upload/v1755123776/Screenshot_20250814_030122_3_jsfajx_e8ac0f.jpg", // Add your image URL here
    socials: [
      { name: "Instagram", href: "https://www.instagram.com/shreeark/", icon: (
        <span className="mc-icon-placeholder">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" width="23" height="23" />
        </span>
      ) },
      { name: "LinkedIn", href: "https://www.linkedin.com/in/arkshree", icon: (
        <span className="mc-icon-placeholder">
          {/* LinkedIn SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
<path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"></path><path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"></path>
</svg>
        </span>
      ) },
      { name: "GitHub", href: "https://github.com/arkshree1", icon: (
        <span className="mc-icon-placeholder">
          {/* GitHub SVG */}
         <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="31" height="31" viewBox="0 0 48 48">
<path fill="#fff" d="M41,24c0,9.4-7.6,17-17,17S7,33.4,7,24S14.6,7,24,7S41,14.6,41,24z"></path><path fill="#455a64" d="M21 41v-5.5c0-.3.2-.5.5-.5s.5.2.5.5V41h2v-6.5c0-.3.2-.5.5-.5s.5.2.5.5V41h2v-5.5c0-.3.2-.5.5-.5s.5.2.5.5V41h1.8c.2-.3.2-.6.2-1.1V36c0-2.2-1.9-5.2-4.3-5.2h-2.5c-2.3 0-4.3 3.1-4.3 5.2v3.9c0 .4.1.8.2 1.1L21 41 21 41zM40.1 26.4C40.1 26.4 40.1 26.4 40.1 26.4c0 0-1.3-.4-2.4-.4 0 0-.1 0-.1 0-1.1 0-2.9.3-2.9.3-.1 0-.1 0-.1-.1 0-.1 0-.1.1-.1.1 0 2-.3 3.1-.3 1.1 0 2.4.4 2.5.4.1 0 .1.1.1.2C40.2 26.3 40.2 26.4 40.1 26.4zM39.8 27.2C39.8 27.2 39.8 27.2 39.8 27.2c0 0-1.4-.4-2.6-.4-.9 0-3 .2-3.1.2-.1 0-.1 0-.1-.1 0-.1 0-.1.1-.1.1 0 2.2-.2 3.1-.2 1.3 0 2.6.4 2.6.4.1 0 .1.1.1.2C39.9 27.1 39.9 27.2 39.8 27.2zM7.8 26.4c-.1 0-.1 0-.1-.1 0-.1 0-.1.1-.2.8-.2 2.4-.5 3.3-.5.8 0 3.5.2 3.6.2.1 0 .1.1.1.1 0 .1-.1.1-.1.1 0 0-2.7-.2-3.5-.2C10.1 26 8.6 26.2 7.8 26.4 7.8 26.4 7.8 26.4 7.8 26.4zM8.2 27.9c0 0-.1 0-.1-.1 0-.1 0-.1 0-.2.1 0 1.4-.8 2.9-1 1.3-.2 4 .1 4.2.1.1 0 .1.1.1.1 0 .1-.1.1-.1.1 0 0 0 0 0 0 0 0-2.8-.3-4.1-.1C9.6 27.1 8.2 27.9 8.2 27.9 8.2 27.9 8.2 27.9 8.2 27.9z"></path><path fill="#455a64" d="M14.2,23.5c0-4.4,4.6-8.5,10.3-8.5c5.7,0,10.3,4,10.3,8.5S31.5,31,24.5,31S14.2,27.9,14.2,23.5z"></path><path fill="#455a64" d="M28.6 16.3c0 0 1.7-2.3 4.8-2.3 1.2 1.2.4 4.8 0 5.8L28.6 16.3zM20.4 16.3c0 0-1.7-2.3-4.8-2.3-1.2 1.2-.4 4.8 0 5.8L20.4 16.3zM20.1 35.9c0 0-2.3 0-2.8 0-1.2 0-2.3-.5-2.8-1.5-.6-1.1-1.1-2.3-2.6-3.3-.3-.2-.1-.4.4-.4.5.1 1.4.2 2.1 1.1.7.9 1.5 2 2.8 2 1.3 0 2.7 0 3.5-.9L20.1 35.9z"></path><path fill="#00bcd4" d="M24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20S35,4,24,4z M24,40c-8.8,0-16-7.2-16-16S15.2,8,24,8 s16,7.2,16,16S32.8,40,24,40z"></path>
</svg>
        </span>
      ) },
    ],
  },
  {
    name: "HARSH DUBEY",
    roll: "23PP3007",
    border: "blue-glow-border",
    img: "https://res.cloudinary.com/djdcwwpbl/image/upload/v1755121888/Screenshot_20250814_032042_rfdgf9.jpg", // Add your image URL here
    socials: [
      { name: "Instagram", href: "https://www.instagram.com/harshonopps?igsh=bGE1aGczYnRoN3g3", icon: (
        <span className="mc-icon-placeholder">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" width="22" height="22" />
        </span>
      ) },
      { name: "LinkedIn", href: "https://www.linkedin.com/in/harshdubey03", icon: (
        <span className="mc-icon-placeholder">
          {/* LinkedIn SVG */}
         <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
<path fill="#0288D1" d="M42,37c0,2.762-2.238,5-5,5H11c-2.761,0-5-2.238-5-5V11c0-2.762,2.239-5,5-5h26c2.762,0,5,2.238,5,5V37z"></path><path fill="#FFF" d="M12 19H17V36H12zM14.485 17h-.028C12.965 17 12 15.888 12 14.499 12 13.08 12.995 12 14.514 12c1.521 0 2.458 1.08 2.486 2.499C17 15.887 16.035 17 14.485 17zM36 36h-5v-9.099c0-2.198-1.225-3.698-3.192-3.698-1.501 0-2.313 1.012-2.707 1.99C24.957 25.543 25 26.511 25 27v9h-5V19h5v2.616C25.721 20.5 26.85 19 29.738 19c3.578 0 6.261 2.25 6.261 7.274L36 36 36 36z"></path>
</svg>
        </span>
      ) },
      { name: "Figma", href: "https://www.figma.com/@GOINHARSH", icon: (
        <span className="mc-icon-placeholder">
          {<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" id="figma">
  <path fill="#0ACF83" d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z"></path>
  <path fill="#A259FF" d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z"></path>
  <path fill="#F24E1E" d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z"></path>
  <path fill="#FF7262" d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z"></path>
  <path fill="#1ABCFE" d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z"></path>
</svg>}
         
        </span>
      ) },
    ],
  },
];

const MeetCreators = () => (
  <section className="meet-creators-section">
    <h2 className="meet-creators-title">Meet The Creators</h2>
    <div className="meet-creators-cards">
      {creators.map((creator, idx) => (
        <div className={`meet-creator-card ${creator.border}`} key={creator.roll}>
          {creator.img
            ? <img className="mc-profile-img" src={creator.img} alt={creator.name} />
            : <div className="mc-profile-img"></div>
          }
          <div className="mc-name">{creator.name}</div>
          <div className="mc-roll">{creator.roll}</div>
          <div className="mc-socials">
            {creator.socials.map((social, i) => (
              <a
                key={social.name}
                href={social.href}
                className="mc-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default MeetCreators;
