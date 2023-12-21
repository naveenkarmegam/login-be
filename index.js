const express = require('express');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');;
const cors = require('cors');
const dotenv = require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb')
const app = express();
const URL = process.env.DB
const secretKey = process.env.JWT_SECRET
const PORT = 4000;
const nodemailer = require("nodemailer");

app.use(express.json());
app.use(cors({
    origin: '*'
}));
app.get('/', (req, res) => {
    res.send(`<h1> server checking route </h1>`)
})
 
app.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await MongoClient.connect(URL)
        const db = connection.db("users")
        const newUser = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
        }
        const result = await db.collection("Registered").insertOne(newUser)
        const token = jsonwebtoken.sign({ userId: result.insertedId }, secretKey, { expiresIn: '1h' });
        res.status(201).json({ message: 'Registration successful', newUser, token });
        connection.close()
    } catch (error) { 
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });

    }
})
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body 
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password.' });
        }
        const connection = await MongoClient.connect(URL)
        const db = connection.db("users")
        const user = await db.collection("Registered").findOne({ email })

        if (!user) {
            res.status(404).json({ message: "User or password not match" })
        }
        const passwordValid = await bcrypt.compare(password, user.password)
        if (!passwordValid) {
            res.status(404).json({ message: "user or password not match" })
        }
        const token = jsonwebtoken.sign({ userId: user._id }, secretKey, { expiresIn: "1h" })
        res.status(200).json({ message: 'Login successful', token });
        connection.close()
    } catch (error) {
        console.log(error)
    }
})

app.post("/forget-password", async (req, res) => {
    try {

        const { email } = req.body
        const connection = await MongoClient.connect(URL)
        const db = connection.db("users")
        const user = await db.collection("Registered").findOne({ email })

        if (!user) {
            res.status(404).json({ message: "User not registered" })
        }
        const token = jsonwebtoken.sign({ id: user._id }, secretKey, { expiresIn: '1hr' })

        await db.collection("Registered").updateOne({ email }, {
            $set: {
                token
            }
        })
        connection.close()

        const transporter = nodemailer.createTransport({
            host: process.env.host,
            port: process.env.SMTP_PORT,
            // secure: false,
            auth: { 
                user: process.env.mail,
                pass: process.env.OUTLOOK_PASSWORD,
            },
            tls: {
                ciphers: 'SSLv3',
            },

        });
        const main = async () => { 
            try {
                const info = await transporter.sendMail({
                    from: "dnelsona@outlook.com",
                    to: email,
                    subject: "Reset password link",
                    text: `Click the following link to reset your password: https://naveen-login-register.netlify.app/reset-password/${token}`
                });
                res.status(200).json({ message: "Password reset link sent successfully." });

            } catch (error) {
                console.log(error);
                res.status(500).json({ message: "Failed to send password reset email." });
            }
        };
        await main();
    } catch (error) {
        console.log(error)
    }
})

app.post("/reset-password/:token", async (req, res) => {
    try {
        const { password, confirmPassword } = req.body
        const token = req.params.token
        jsonwebtoken.verify(token, secretKey,async (err, decoded) => {
            try {
                if (err) {
                    res.json({
                        message: "Error with token"
                    })
                } else {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const connection = await MongoClient.connect(URL)
                    const db = connection.db("users")
                    const user = await db.collection("Registered").findOne({ token: token })
    
                    await db.collection("Registered").updateOne({ token }, {
                        $set: {
                            password: hashedPassword,
                            confirmPassword: hashedPassword
                        }
                    })
                    connection.close()
                    res.send({ message: "Password changed succesfully", user })
                } 
            } catch (error) {
                console.log(error)
            }
        })

    } catch (error) {
        console.log(error)
    }

})
app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT} ...`);
})