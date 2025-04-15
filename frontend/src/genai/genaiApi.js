export const searchMedicines = async (query) => {
    try {
      const response = await fetch("http://localhost:3001/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicines: query
        }),
      });
  
      const data = await response.json();
      return data;
    } catch (err) {
      return {
        success: false,
        error: err.message
      };
    }
  };
  