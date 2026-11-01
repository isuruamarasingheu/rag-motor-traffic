import React, { useState } from 'react';
import Header from './components/Header';
import QueryInput from './components/QueryInput';
import ResponseCard from './components/ResponseCard';
import SourcesList from './components/SourcesList';
import Disclaimer from './components/Disclaimer';

export default function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    const cleanQ = question.trim();
    if (!cleanQ || cleanQ.length < 3) {
      setError('Please enter a question with at least 3 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: cleanQ }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Server returned error (${response.status})`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to the legal assistant backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <div>
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
          <QueryInput
            question={question}
            setQuestion={setQuestion}
            onSubmit={handleAsk}
            loading={loading}
            error={error}
          />

          <ResponseCard result={result} />

          {result && result.citations && result.citations.length > 0 && (
            <SourcesList citations={result.citations} />
          )}
        </main>
      </div>

      <Disclaimer />
    </div>
  );
}

