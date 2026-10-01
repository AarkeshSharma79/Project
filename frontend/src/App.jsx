import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  const predictDisease = async () => {
    if (!image) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", image);

    try {
      const response = await fetch(
        "http://localhost:8000/api/predict",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setResult(data);

    } catch (err) {
      console.error(err);
      setError(
        err.message ||
        "Unable to connect to the prediction server."
      );
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="app">

      <header className="header">
        <h1>🌱 Crop Disease Detection</h1>
        <p>
          Upload a crop leaf image and let AI identify the disease.
        </p>
      </header>

      <main className="container">

        {/* Upload Card */}
        <div className="card">

          <h2>Upload Crop Image</h2>

          <label className="upload-box">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />

            {preview ? (
              <img
                src={preview}
                alt="Crop preview"
                className="preview"
              />
            ) : (
              <div className="upload-content">
                <span className="upload-icon">📷</span>
                <p>Click to upload an image</p>
                <small>PNG, JPG, JPEG</small>
              </div>
            )}
          </label>

          {image && (
            <p className="filename">
              Selected: {image.name}
            </p>
          )}

          <button
            className="predict-button"
            onClick={predictDisease}
            disabled={!image || loading}
          >
            {loading ? "🔄 Analyzing..." : "🔍 Detect Disease"}
          </button>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </div>

        {/* Result */}
        {result && result.success && (
          <div className="result-card">

            <h2>Prediction Result</h2>

            <div className="main-result">

              <p className="label">
                Detected Disease
              </p>

              <h3>
                {result.disease}
              </h3>

              <div className="confidence">
                <span>Confidence</span>
                <strong>
                  {result.confidence}%
                </strong>
              </div>

              <div className="progress">
                <div
                  className="progress-bar"
                  style={{
                    width: `${result.confidence}%`,
                  }}
                />
              </div>

            </div>

            <div className="top-results">

              <h3>Top Predictions</h3>

              {result.top_predictions.map(
                (item, index) => (
                  <div
                    className="prediction"
                    key={index}
                  >

                    <div>
                      <strong>
                        {index + 1}. {item.disease}
                      </strong>
                    </div>

                    <span>
                      {item.confidence}%
                    </span>

                  </div>
                )
              )}

            </div>

          </div>
        )}

      </main>

      <footer>
        <p>
          Crop Disease Detection using EfficientNetB0
        </p>
        <p>
          41 Disease Classes
        </p>
      </footer>

    </div>
  );
}

export default App;