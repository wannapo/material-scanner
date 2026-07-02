"use client";

import { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function Home() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const toBase64 = (file) => new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.readAsDataURL(file);
      });

      const base64 = await toBase64(image);

      const prompt = `Kamu adalah ahli material bangunan. Analisis foto ini dan jawab HANYA dengan JSON berikut, tanpa teks lain:
{
  "nama_objek": "nama objek yang terlihat",
  "komposisi": [
    { "material": "nama material", "persentase": 60, "estimasi_harga": "Rp X.000/satuan" }
  ],
  "catatan": "penjelasan singkat 1 kalimat"
}`;

      const res = await model.generateContent([
        prompt,
        { inlineData: { mimeType: image.type, data: base64 } },
      ]);

      const text = res.response.text().replace(/```json|```/g, "").trim();
      setResult(JSON.parse(text));
    } catch (err) {
      alert("Error: " + err.message);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">🏗️ Material Scanner</h1>

      {/* Upload Area */}
      <div
        onClick={() => fileRef.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition"
      >
        {preview ? (
          <img src={preview} className="w-full rounded-lg" alt="preview" />
        ) : (
          <div className="text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p>Klik untuk upload foto material</p>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

      {/* Tombol Analisis */}
      {image && (
        <button
          onClick={analyze}
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "⏳ Menganalisis..." : "🔍 Analisis Material"}
        </button>
      )}

      {/* Hasil */}
      {result && (
        <div className="mt-6 bg-white rounded-xl p-4 shadow">
          <h2 className="font-bold text-lg mb-3">✅ {result.nama_objek}</h2>

          <p className="text-sm font-semibold text-gray-500 mb-2">📦 Komposisi Material:</p>
          <div className="space-y-2">
            {result.komposisi.map((item, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium">{item.material}</p>
                  <p className="text-xs text-gray-400">{item.persentase}%</p>
                </div>
                <p className="text-blue-600 font-semibold text-sm">{item.estimasi_harga}</p>
              </div>
            ))}
          </div>

          {result.catatan && (
            <p className="mt-3 text-xs text-gray-500 italic">💡 {result.catatan}</p>
          )}
        </div>
      )}
    </main>
  );
}