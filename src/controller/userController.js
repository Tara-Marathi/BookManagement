const userModel = require("../model/userModel");
const jwt = require("jsonwebtoken");
const validator = require("../validator/validator")


// ============================== User creation =================================
const createUser = async function (req, res) {
    try {
        const requestBody = req.body;
        //IF DATA NOT COME IN BODY
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "Enter Registration Details in body" });
        }
        const { title, name, phone, email, password, address } = requestBody; //DESTRUCTURING

        // DATA COMING VALIDATIONS
        if (!validator.isValid(title) || !validator.isValidTitle(title)) {
            return res.status(400).send({ status: false, message: "Enter Title First ,As well as any One of 'Mr , Mrs , Miss'" });
        }
        
        if (!validator.isValid(name)) {
            return res.status(400).send({ status: false, message: "Enter Name first" });
        }
        // MOBILE VALIDATION
        if (!validator.isValid(phone) || !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).send({ status: false, message: "Enter Mobile No First, as Well Valid No" });
        }
        
        //EMAIL VALIDATION
        if (!validator.isValid(email) || !validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Enter Email First , Also  Valid" });
        }
       
        // PASSWORD VALIDATIONS
        if (!validator.isValid(password) || !(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Enter Password First, Also it Should be 8 to 15 Digits" });
        }
        
        // ADDRESS VALIDATIONS 
        if (!validator.isValid(address)) {
            return res.status(400).send({ status: false, message: "Enter Address first" });
        }
        if (!validator.isValid(address.street)) {
            return res.status(400).send({ status: false, message: "Enter Street first" });
        }
        if (!validator.isValid(address.city)) {
            return res.status(400).send({ status: false, message: "Enter City first" });
        }
        if (!validator.isValid(address.pincode)) {
            return res.status(400).send({ status: false, message: "Enter Pincode first" });
        }
        if (Object.keys(address.pincode).length !== 6) {
            return res.status(400).send({ status: false, message: "Enter valid Pincode" });
        }
        // DUPLICAY VALIDATION
        const uniqueEmail = await userModel.findOne({ email: email });
        if (uniqueEmail) {
            return res.status(400).send({ status: false, message: "User's Email Allready  Exist" });
        }
        const uniquePhone = await userModel.findOne({ phone: phone });
        if (uniquePhone) {
            return res.status(400).send({ status: false, message: "User's phone Allready  Exist" });
        }
        // DATA CREATION
        const createdUser = await userModel.create(requestBody);
        res.status(201).send({ status: true, message: "Successfully data created", data: createdUser });
    }
    catch (err) {
        res.status(500).send({ status: false, Error: err.message })
    }
};

const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        // IF DATA NOT COMING
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "Enter Login details" });
        }
        const { email, password } = requestBody; // DESTRUCTURING

        //  Email Validations
        if (!validator.isValid(email) || !validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Enter Email First as Well as Valid Also" })
        }
        
        // password validations
        if (!validator.isValid(password) || !(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Enter password first Also valid" });
        }
        
        //  DB VALIDATIONS 
        const existUser = await userModel.findOne(requestBody)
        if (!existUser) {
            return res.status(401).send({ status: false, message: "Email or Password is incorrect" });
        }
        //  TOKEN CREATION
        const token = jwt.sign({
            userId: existUser._id,
            group: "group-1",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60
        }, "indiaisgreate");
        //TOKEN SENDING
        res.setHeader("x-api-key", token)
        return res.status(200).send({ status: true, message: "Logined successfully", Token: token })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { createUser, loginUser }
