const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
const app = express ();
const PORT = process.env.PORT || 5000;

//middleware 
app.use(cors({
    origin:process.env.FRONTEND_URL || "http://localhost:5173",
credentials :true
}));
app.use(express.json())

//routes
const urlRoutes = require('./routes/urlRoutes');
app.use('/',urlRoutes);

//mongodb connection 
mongoose.connect(process.env.Mongo_URI)
.then(()=>console.log('MongoDB connected'))
.catch((err)=>console.error("Mongodb connection error:",err));

const Port = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`)
})