import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {

  const [url, setUrl] = useState("");

  const [report, setReport] = useState(null);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const audit = async () => {

    setLoading(true);

    setError("");

    setReport(null);

    try {

      const res = await axios.post("https://website-auditor-jha9.onrender.com/audit", {
        url
      });

      setReport(res.data);

    } catch (err) {

      setError(
        err.response?.data?.error ||
          "Something went wrong"
      );

    }

    setLoading(false);

  };

  return (
    <div className="container">

      <h1>Website Auditor</h1>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button onClick={audit}>
        Audit
      </button>

      {loading && <p>Loading...</p>}

      {error && (
        <p className="error">
          {error}
        </p>
      )}

      {report && (

        <div className="card">

          <h2>Audit Report</h2>

          <p><b>HTTP Status:</b> {report.status}</p>

          <p><b>Response Time:</b> {report.responseTime} ms</p>

          <p><b>Title:</b> {report.title}</p>

          <p><b>Meta Description:</b> {report.metaDescription}</p>

          <p><b>H1 Count:</b> {report.h1Count}</p>

          <p><b>Images Missing Alt:</b> {report.missingAlt}</p>

          <p><b>Approx Word Count:</b> {report.wordCount}</p>

        </div>

      )}

    </div>
  );
}

export default App;
