import React, { useState } from "react";

function DeleteSpot() {
  const [spotName, setSpotName] = useState("");
  const [message, setMessage] = useState("");

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/delete-spot`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            // ✅ Authorization header added
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ spotName }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage("⚠️ Error deleting spot");
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-4">Delete Parking Spot</h2>
      <input
        type="text"
        placeholder="Enter spot name"
        value={spotName}
        onChange={(e) => setSpotName(e.target.value)}
        className="border p-2 mr-2"
      />
      <button
        onClick={handleDelete}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Delete
      </button>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}

export default DeleteSpot;
