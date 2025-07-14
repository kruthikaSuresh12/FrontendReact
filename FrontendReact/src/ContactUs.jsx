import React from 'react';
import './App.css';

function ParkingApp() {
  return (
    <div className="parking-app">
      <header className="app-header">
        <h1>Parking Spot Assistance</h1>
        <p className="tagline">Hassle-free parking solutions at your fingertips</p>
      </header>

      <main className="app-content">
        <section className="hero-section">
          <h2>Find & Book Parking Spots Easily</h2>
          <p className="description">
            Our platform helps you discover available parking spots in real-time, 
            book in advance, and avoid the stress of finding parking in busy areas.
          </p>
        </section>

        <section className="features">
          <div className="feature-card">
            <h3>Real-time Availability</h3>
            <p>See available spots instantly</p>
          </div>
          <div className="feature-card">
            <h3>Advance Booking</h3>
            <p>Reserve your spot ahead of time</p>
          </div>
          <div className="feature-card">
            <h3>Time-Saving</h3>
            <p>No more circling for parking</p>
          </div>
        </section>

        <section className="contact-section">
          <h2>Need Help? Contact Us</h2>
          <div className="contact-methods">
            <div className="contact-item">
              <span className="contact-label">Phone</span>
              <span>+91 91410 81733</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Email</span>
              <span>kruthika1208@gmail.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Instagram</span>
              <span>@kruthika.s_07</span>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <p className="testimonial">
            Ready to book your parking spot?<br />
            Join thousands of happy parkers who save time and stress every day
          </p>
          <button className="cta-button">Find Available Spots Now</button>
        </section>
      </main>
    </div>
  );
}

export default ParkingApp;