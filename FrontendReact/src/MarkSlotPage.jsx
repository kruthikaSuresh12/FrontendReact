import React from "react";

const MarkSlotPage = () => {
  const handleBooked = () => {
    alert("Slot marked as Booked");
  };

  const handleEmpty = () => {
    alert("Slot marked as Empty");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <h1 style={styles.heading}>Mark the slot</h1>
        <button style={styles.button} onClick={handleBooked}>
          Mark as Booked
        </button>
        <button style={styles.button} onClick={handleEmpty}>
          Mark as Empty
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
     marginLeft: "38rem"
  },
  
  button: {
    display: "block",
    width: "200px",
    padding: "10px 20px",
    fontSize: "16px",
    margin: "10px auto",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#4CAF50",
    color: "white",
    cursor: "pointer",
  },
};

export default MarkSlotPage;

