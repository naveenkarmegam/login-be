const express = require('express');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');;
const cors = require('cors');
const dotenv = require('dotenv').config();
const {MongoClient,ObjectId} = require('mongodb')
const app = express();

const PORT = 4000;
app.use(express.json());
app.use(cors({
    origin:'*'
}));

app.get('/', (req,res)=>{
    res.send(`<h1> server checking route </h1>`)
})

app.post('/register', async(req,res)=>{
    try {
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            
        })
        
    }
})

app.listen(PORT,()=>{
    console.log(`server started at http://localhost:${PORT} ...`);
})
