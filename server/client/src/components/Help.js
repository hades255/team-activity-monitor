import React from "react";
import "./Help.css";
import { SERVER_API_PATH, SERVER_PATH } from "../config";

const Help = () => {
  return (
    <div className="help-page">
      <div className="container">
        <h1 className="mb-4">Help & Support</h1>

        <div className="row">
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">About Team Monitor</h2>
                <p className="card-text">
                  Team Monitor is a productivity tracking tool designed to help
                  teams and organizations monitor and improve their work
                  efficiency. It provides detailed insights into application
                  usage, working hours, and team activities.
                </p>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">Features</h2>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    <strong>Activity Tracking:</strong> Monitor application
                    usage and working hours
                  </li>
                  <li className="list-group-item">
                    <strong>Team Analytics:</strong> View team-wide activity
                    patterns and trends
                  </li>
                  <li className="list-group-item">
                    <strong>Banned Apps Monitoring:</strong> Track usage of
                    restricted applications
                  </li>
                  <li className="list-group-item">
                    <strong>Detailed Reports:</strong> Generate comprehensive
                    activity reports
                  </li>
                  <li className="list-group-item">
                    <strong>Real-time Updates:</strong> Get instant updates on
                    team activities
                  </li>
                </ul>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">How to Use</h2>
                <div className="steps">
                  <div className="step mb-4">
                    <h4>Get Your Credentials</h4>
                    <p>
                      Contact your administrator to get your <i>username</i> and{" "}
                      <i>password</i>.
                    </p>
                  </div>

                  <div className="step mb-4">
                    <h4>Web Dashboard Access</h4>
                    <p>Login to the web dashboard using your credentials at:</p>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={`${SERVER_PATH}/login`}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(`${SERVER_PATH}/login`)
                        }
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="step mb-4">
                    <h4>Download and Install Client App</h4>
                    <p>
                      Download the{" "}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`${SERVER_PATH}/api/download/client`}
                      >
                        client application
                      </a>
                    </p>
                    <p className="mt-2">
                      After downloading, run the installer and follow the
                      installation steps.
                    </p>
                  </div>

                  <div className="step mb-4">
                    <h4>Initial Setup</h4>
                    <p>When you first run the client application:</p>
                    <ol>
                      <li>Enter your username and password</li>
                      <li>Enter the server URL:</li>
                      <div className="input-group mb-2 mt-1">
                        <input
                          type="text"
                          className="form-control"
                          value={`${SERVER_API_PATH}`}
                          readOnly
                        />
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(`${SERVER_API_PATH}`)
                          }
                        >
                          Copy
                        </button>
                      </div>
                      <li>Click "Test Connection" to verify the connection</li>
                      <li>Click "OK" to save the settings</li>
                    </ol>
                  </div>

                  <div className="step mb-4">
                    <h4>Start Monitoring</h4>
                    <p>Once setup is complete:</p>
                    <ul>
                      <li>
                        The client will automatically start monitoring your
                        activity
                      </li>
                      <li>
                        You can view your activity data on the web dashboard
                      </li>
                      <li>
                        The client runs in the system tray - right-click to
                        access settings
                      </li>
                    </ul>
                  </div>

                  <div className="step">
                    <h4>Server Information</h4>
                    <p>Server Address:</p>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={SERVER_PATH}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(SERVER_PATH)
                        }
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">Need Help?</h2>
                <p className="card-text">
                  If you need additional assistance or have specific questions,
                  please contact our support team:
                </p>
                <ul className="list-unstyled">
                  <li>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="mailto:montgasam@gmail.com"
                    >
                      Email: montgasam@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://wa.me/14472897949"
                    >
                      Whatsapp: +1 (447) 289 7949
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://t.me/z_sm_0001"
                    >
                      Telegram: @z_sm_0001
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Quick Tips</h2>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">
                    Use the dashboard filters to focus on specific time periods
                  </li>
                  <li className="list-group-item">
                    Check the detailed view for minute-by-minute activity
                  </li>
                  <li className="list-group-item">
                    Export data for detailed analysis
                  </li>
                  <li className="list-group-item">
                    Set up notifications for important events
                  </li>
                </ul>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">Frequently Asked Questions</h2>
                <div className="accordion" id="faqAccordion">
                  <div className="accordion-item">
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq1"
                      >
                        How does the activity tracking work?
                      </button>
                    </h3>
                    <div
                      id="faq1"
                      className="accordion-collapse collapse show"
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body">
                        The application tracks active windows and applications
                        in use. It records the time spent on each application
                        and categorizes them based on predefined rules.
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq2"
                      >
                        How are banned applications handled?
                      </button>
                    </h3>
                    <div
                      id="faq2"
                      className="accordion-collapse collapse"
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body">
                        Banned applications are tracked and highlighted in the
                        dashboard. Their usage is recorded and can be reviewed
                        by administrators.
                      </div>
                    </div>
                  </div>

                  <div className="accordion-item">
                    <h3 className="accordion-header">
                      <button
                        className="accordion-button collapsed"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#faq3"
                      >
                        How can I view my team's activity?
                      </button>
                    </h3>
                    <div
                      id="faq3"
                      className="accordion-collapse collapse"
                      data-bs-parent="#faqAccordion"
                    >
                      <div className="accordion-body">
                        Navigate to the Team Activity page to view aggregated
                        activity data for your entire team. You can filter by
                        date range and view different metrics.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
