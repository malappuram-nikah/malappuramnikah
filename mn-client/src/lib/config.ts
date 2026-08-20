export const API_URL = 
  process.env.NODE_ENV === "development" 
    ? "http://localhost:3333" 
    : (process.env.NEXT_PUBLIC_API_URL || 
       process.env.REACT_APP_API_URL || 
       "https://malappuramnikah.onrender.com");
