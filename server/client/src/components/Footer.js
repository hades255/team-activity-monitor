import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer mt-auto py-3">
      <div className="container">
        <div className="row">
          <div className="col-md-4">
            <h5>Team Monitor</h5>
            <p className="text-muted">
              A productivity monitoring tool for tracking team activities and ensuring efficient work practices.
            </p>
          </div>
          <div className="col-md-4">
            <h5>Quick Links</h5>
            <ul className="list-unstyled">
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/team-activity">Team Activity</Link></li>
              <li><Link to="/help">Help & Support</Link></li>
            </ul>
          </div>
          <div className="col-md-4">
            <h5>Contact</h5>
            <ul className="list-unstyled">
                <li><a target='_blank' rel='noreferrer' href="mailto:montgasam@gmail.com">Email: montgasam@gmail.com</a></li>
                <li><a target='_blank' rel='noreferrer' href="https://wa.me/14472897949">Whatsapp: +1 (447) 289 7949</a></li>
                <li><a target='_blank' rel='noreferrer' href="https://t.me/z_sm_0001">Telegram: @z_sm_0001</a></li>
            </ul>
          </div>
        </div>
        <hr />
        <div className="row">
          <div className="col-12 text-center">
            <p className="mb-0">
              &copy; {currentYear} Team Monitor. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 