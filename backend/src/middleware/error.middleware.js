module.exports = (error, req, res, next) => {
    console.error("API Error:", error);
  
    res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  };