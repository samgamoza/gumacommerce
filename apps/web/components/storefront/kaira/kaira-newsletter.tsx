"use client";

import { FormEvent, useState } from "react";

export function KairaNewsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  return (
    <section className="kaira-newsletter">
      <div className="kaira-container">
        <h3>Sign Up for our newsletter</h3>
        {submitted ? (
          <p className="text-[var(--kaira-primary)]">Thanks for subscribing!</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
            />
            <button type="submit" className="kaira-btn kaira-btn-dark">
              Sign Up
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
