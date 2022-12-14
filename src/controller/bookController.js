const mongoose = require("mongoose");
const bookModel = require("../model/bookModel");
const userModel = require("../model/userModel");
const reviewModel = require("../model/reviewModel");
const validator = require("../validator/validator");

//  ============================================= BOOK  CREATION  ================================================
const regType04 = /^[A-Za-z, ]{4,}$/ //
const createBook = async function (req, res) {
    try {
        const requestBody = req.body;
        // IF BOY IS EMPTY
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "Please fill all mandatory fields" });
        }
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = requestBody; //   DESTRUCTURING
        //   VALIDATIONS
        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: "'Title' is mandatory to fill" });
        }
        if (!validator.isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "'Excerpt' is mandatory to fill" });
        }
        if (!validator.isValid(userId) || !validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "UserId Should be valid and mandatory to fill" });
        }
        if (!validator.isValid(ISBN) || !validator.isValidRegxISBN(ISBN)) {
            return res.status(400).send({ status: false, message: "Please Enter a Valid ISBN Number, Type-'String' manadatory field" });
        }
        if (!validator.isValid(category)) {
            return res.status(400).send({ status: false, message: "Category is mandatory and should be 'String Type'" });
        }
        if (!validator.isValid(subcategory) || !regType04.test(subcategory)) {
            return res.status(400).send({ status: false, message: "Subcategory is mandatory and should be 'String inside an Array'" });
        }
        if (!validator.isValid(releasedAt) || !validator.isValidRegxDate(releasedAt)) {
            return res.status(400).send({ status: false, message: "Enter the date in YYYY-MM-DD format, is mandatory field." });
        }
        //  CHECKING UNIQUE EXISTENCE IN DB
        const isbnExist = await bookModel.findOne({ ISBN: ISBN });
        if (isbnExist) {
            return res.status(400).send({ status: false, message: " Doublicate ISBN, not Allowed! " });
        }
        const titleExist = await bookModel.findOne({ title: title })
        if (titleExist) {
            return res.status(400).send({ status: false, message: " Title Already exists Use Different. " });
        }
        // USER  EXISTANCE IN DB
        const userExist = await userModel.findOne({ _id: userId });
        if (!userExist) {
            return res.status(404).send({ status: false, message: "User does not exist with This UserId Register First" });
        }
        //  CHECKING USER AUTHERIZATION
        if (req.loggedInUser != userId) {
            return res.status(403).send({ status: false, message: "Unauthorize to create book" });
        }
        if (requestBody.isDeleted == true) {
            deletedAt = Date.now()
            requestBody["deletedAt"] = deletedAt
        }
        //  DATA  CREATION
        const createdBook = await bookModel.create(requestBody);
        res.status(201).send({ status: true, message: "Successfully Created", data: createdBook });
    }
    catch (err) {
        return res.status(500).send({ status: false, Error: err.message })
    }
};

// ================================================  UPDATING BOOK   ================================================

const updateBook = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //BOOKID VALIDATIONS
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter BookId in Params also Valid Id" });
        }
        //  DOCUMENT EXIST OR NOT IN DB
        const dbbook = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!dbbook) {
            return res.status(404).send({ status: false, message: "Book not found With Given id" });
        }

        if (req.loggedInUser != dbbook.userId) {   //// CHECKING USER AUTHERIZATION
            return res.status(403).send({ status: false, message: "Unauthorize To Make Changes" });
        }       
       
        const requestBody = req.body;

        //  IF BODY IS EMPTY
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "Enter Data in Body to update book" });
        }

        const { title, excerpt, releasedAt, ISBN } = requestBody; // DESTRUCTURING
        const filter = {}
        // BODY DATA VALIDATIONS
        if(title){
            if (!validator.isValid(title)) {
                return res.status(400).send({ status: false, message: "Enter Title" });
            }
            filter['title'] = title.trim()

        }

        if(excerpt){
            if (!validator.isValid(excerpt)) {
                return res.status(400).send({ status: false, message: "Enter excerpt" });
            }
            filter['excerpt'] = excerpt.trim()
        }
        
        if(releasedAt){
            if (!validator.isValid(releasedAt) || !validator.isValidRegxDate(releasedAt)) {
                return res.status(400).send({ status: false, message: "Enter release date, Formate Should be 'YYYY-MM-DD' " });
            }
            filter['releasedAt'] = releasedAt.trim()
        }   
        
        //  ISBN NO VALIDATION
        if(ISBN){
            if (!validator.isValid(ISBN) || !validator.isValidRegxISBN(ISBN)) {
                return res.status(400).send({ status: false, message: "Enter ISBN Also Valid" });
            }
            filter['ISBN'] = ISBN.trim()
        }
        
        // CHECKING UNIQUE EXISTANCE IN DB
        const uniqueIsbn = await bookModel.findOne({ ISBN: ISBN });
        if (uniqueIsbn) {
            return res.status(400).send({ status: false, message: "ISBN Allready Exist, Use Different one" });
        }
        const uniqueTitle = await bookModel.findOne({ title: title });
        if (uniqueTitle) {
            return res.status(400).send({ status: false, message: "Title Allready Exist Use different Title" });
        }
        //  UPADATING DOCUMENT IN DB
        const updatedBook = await bookModel.findByIdAndUpdate({ _id: bookId }, { $set: filter }, { new: true });
        return res.status(200).send({ status: true, message: "Updated Successfully", data: updatedBook })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
};

//  =========================================== GET  APIs   =================================================
const getBook = async function (req, res) {
    try {
        const queryParams = req.query;
        const filter = { isDeleted: false }
        //  IF QUERY IS EMPTY
        if (Object.keys(queryParams).length > 0) {

            const { userId, category, subcategory } = queryParams;   //DESTRUCTURING 
            //  QUERY VALIDATIONS
            if (validator.isValid(userId) && (validator.isValidObjectId(userId))) {
                filter['userId'] = userId
            }
            if (validator.isValid(category)) {
                filter['category'] = category
            }
            if (validator.isValid(subcategory)) {
                const subArray = subcategory.trim().split(",").map(value => value.trim());
                filter['subcategory'] = { $all: subArray }
            }
        }  // END VALIDATION
        const books = await bookModel.find(filter).select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1 }).sort({ title: 1 });
        if (books.length === 0) {
            return res.status(404).send({ status: false, message: "Books not found" });
        }
        res.status(200).send({ status: true, message: "Books list", data: books });
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//     ==============================================  GET BY BOOKID  ==========================================

const getBookByBookId = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //    VALIDATION
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "userId is Invalid" });
        }
        //   FETCHING BOOK  WITH   BOKK ID
        const book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        // WHEN  NOT FOUND
        if (!book) {
            return res.status(404).send({ status: false, mseesge: "book not found" })
        }
        // FETCHING   REVIEW   FROM   REVIEW   MODEL 
        const review = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 });
        const { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt } = book

        const data = { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt }
        data["reviewData"] = review;
        // SENDING   BOOK   LIST 
        return res.status(200).send({ status: true, msg: "Book list", data: data });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

// ====================================================  DELETING BOOK  ====================================================
const deleteBook = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        if (!validator.isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter BookId in Params, also Valid Id" })
        }
        const existBook = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!existBook) {
            return res.status(404).send({ status: false, message: "Book not Found" });
        }
        //// CHECKING USER AUTHORIZATION
        if (req.loggedInUser != existBook.userId) {
            return res.status(403).send({ status: false, message: "Unauthorize To Make Changes" })
        }
        deletedAt = Date.now();
        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: deletedAt } }, { new: true });
        return res.status(200).send({ status: true, message: "Successfully Deleted", data: updatedBook })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

module.exports = { createBook, updateBook, deleteBook, getBook, getBookByBookId }

