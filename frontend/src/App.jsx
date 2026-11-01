import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import QueryInput from './components/QueryInput';
import ResponseCard from './components/ResponseCard';
import Disclaimer from './components/Disclaimer';

export default function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([
    { question: 'What is the noise emission limit for a motorcycle silencer?' },
    { question: 'Can a landlord evict a tenant without notice?' },
  ]);

  const handleAsk = async (e, customQ = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanQ = (customQ !== null ? customQ : question).trim();

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

      // Add to recent history
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.question !== cleanQ);
        return [{ question: cleanQ, status: data.status }, ...filtered].slice(0, 10);
      });
    } catch (err) {
      setError(err.message || 'Failed to connect to the legal assistant backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = (q) => {
    setQuestion(q);
    handleAsk(null, q);
  };

  const handleNewQuestion = () => {
    setQuestion('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        onSelectQuery={handleSelectQuery}
        onNewQuestion={handleNewQuestion}
        history={history}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 max-w-5xl w-full mx-auto">
          <QueryInput
            question={question}
            setQuestion={setQuestion}
            onSubmit={(e) => handleAsk(e)}
            loading={loading}
            error={error}
          />

          <ResponseCard result={result} loading={loading} />
        </main>

        <Disclaimer />
      </div>
    </div>
  );
}
