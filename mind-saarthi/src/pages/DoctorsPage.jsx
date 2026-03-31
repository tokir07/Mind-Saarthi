import React, { useEffect, useState } from "react";
import axios from "axios";

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/doctors");
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nearby Doctors</h1>

      <div className="grid gap-4">
        {doctors.map((doc, index) => (
          <div key={index} className="bg-white p-4 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold">{doc.name}</h2>
            <p>{doc.specialization}</p>
            <p>⭐ {doc.rating}</p>
            <p>📍 {doc.address}</p>

            <div className="flex gap-3 mt-3">
              <a href={`tel:${doc.phone}`} className="bg-green-500 text-white px-3 py-1 rounded">
                Call
              </a>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                View Map
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorsPage;