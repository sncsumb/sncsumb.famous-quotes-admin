import express from 'express';
import mysql from 'mysql2/promise';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

//for Express to get values using POST method
app.use(express.urlencoded({extended:true}));

//setting up database connection pool
const pool = mysql.createPool({
    host: "bbj31ma8tye2kagi.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "cto7bfiig0mvtgsm",
    password: "ykkxsnur54eqhvn4",
    database: "cpersmr9a3j28s5s",
    connectionLimit: 10,
    waitForConnections: true
});

//routes
app.get('/', (req, res) => {
   res.render('index')
});

// Display form for input Author information
app.get("/author/new", (req, res) => {
   res.render("newAuthor")
});

//Store new author into database - POST is used for this
app.post("/author/new", async function(req, res){
    let fName = req.body.fName; //get values submitted through the form
    let lName = req.body.lName;
    let birthDate = req.body.birthDate;
    let deathDate = req.body.deathDate;
    let sex = req.body.sex;
    let profession = req.body.profession;
    let biography = req.body.biography;

    let sql = `INSERT INTO q_authors
        (firstName, lastName, dob, dod, sex, profession, biography)
        VALUES (?, ?, ?, ?, ?, ?, ?)`; //use ? to avoid SQL injection
    let params = [fName, lName, birthDate, deathDate, sex, profession, biography];
    const [rows] = await pool.query(sql, params);
    res.render("newAuthor",{message: "Author added!"});
});

//Route to display a list of authors
app.get("/authors", async function(req, res){
    let sql = `SELECT *
    FROM q_authors
    ORDER BY lastName`;
    const [rows] = await pool.query(sql);
    res.render("authorList", {"authors":rows});
});

//Retrieve all data for a selected author
app.get("/author/edit", async function(req, res){
    let authorId = req.query.authorId; //receive authorId when clicking on any author name
    let sql = `SELECT *,
        DATE_FORMAT(dob, '%Y-%m-%d') dobISO,
        DATE_FORMAT(dod, '%Y-%m-%d') dodISO
        FROM q_authors
        WHERE authorId = ${authorId}`;
    const [rows] = await pool.query(sql);
    res.render("editAuthor", {"authorInfo":rows});
});

//Post updated data for author
app.post("/author/edit", async function(req, res){
    let authorId = req.body.authorId;

    let sql = `UPDATE q_authors
        SET firstName = ?,
        lastName = ?,
        dob = ?,
        dod = ?,
        sex = ?,
        profession = ?,
        country = ?,
        portrait = ?,
        biography = ?
        WHERE authorId = ${authorId}`;
    let params = [req.body.fName,
        req.body.lName, req.body.dob,
        req.body.dod,req.body.sex, 
        req.body.profession, req.body.country,
        req.body.portrait, req.body.biography];
    const [rows] = await pool.query(sql,params);
    console.log(rows);
    res.redirect("/authors");
});

// Delete Author
app.get("/author/delete", async function(req, res) {
    let authorId = req.query.authorId;

    let sql = `DELETE
        FROM q_authors
        WHERE authorId = ?`;

    await pool.query(sql, [authorId]);

    res.redirect("/authors");
})

// FOR QUOTES
//Route to display a list of quotes and the author's name
app.get("/quotes", async function(req, res){
    let sql = `SELECT *
        FROM q_quotes`;
    const [rows] = await pool.query(sql);
    console.log(rows);
    res.render("quoteList", {"quotes":rows});
});

// Display form for input Quote information
app.get("/quote/new", async function(req, res) {

    //For author dropdown
    let sql = `SELECT *
        FROM q_authors`;
    const [rows] = await pool.query(sql);

   res.render("newQuote", {authors:rows});
});

//Store new quote into database - POST is used for this
app.post("/quote/new", async function(req, res){
    //send information to the body request to get values submitted in the form
    let quote = req.body.quote;
    let category = req.body.category;
    let likes = req.body.likes;
    let authorId = req.body.authorId;

    //insert information from form into table
    let sqlQuotes = `INSERT INTO q_quotes
        (quote, authorId, category, likes)
        VALUES (?,?,?,?)`; //use ? to avoid SQL injection

    let paramsQuotes = [quote, authorId, category, likes];
    await pool.query(sqlQuotes, paramsQuotes);

    //For author dropdown
    let sql = `SELECT *
        FROM q_authors`;
    const [rows] = await pool.query(sql);

    res.render("newQuote",{message: "Quote added!", authors:rows});
});

//Retrieve all data for a selected qupte
app.get("/quote/edit", async function(req, res){
    let quoteId = req.query.quoteId; //receive quote when clicking on any quote
    console.log(quoteId);
    let sql = `SELECT *, authorId, firstName,lastName
        FROM q_quotes
        NATURAL JOIN q_authors
        WHERE quoteId = ${quoteId}`;
    const [rows] = await pool.query(sql);
    res.render("editQuote", {"quoteInfo":rows});
});

//Post updated data for quote
app.post("/quote/edit", async function(req, res){
    let quoteId = req.body.quoteId; //receive quoteId from hidden (body)
    let authorId = req.body.authorId; //receive quoteId from hidden (body)

    console.log(req.body);

    let sqlQuotes = `UPDATE q_quotes
        SET quote = ?,
        category = ?
        WHERE quoteId = ${quoteId}`;
    let sqlAuthor = `UPDATE q_authors
        SET firstName = ?,
        lastName = ?
        WHERE authorId = ${authorId}`;
 
    let paramsQuotes = [req.body.quote,
        req.body.category
        ];
    let paramsAuthor = [
        req.body.fName,
        req.body.lName
    ];   
    const [rowsQuotes] = await pool.query(sqlQuotes,paramsQuotes);
    const [rowsAuthor] = await pool.query(sqlAuthor,paramsAuthor);
    res.redirect("/quotes");
});

app.get("/quote/delete", async function(req, res) {
    let quoteId = req.query.quoteId;

    let sql = `DELETE
        FROM q_quotes
        WHERE quoteId = ?`;

    await pool.query(sql, [quoteId]);

    res.redirect("/quotes");
})

app.get("/dbTest", async(req, res) => {
   try {
        const [rows] = await pool.query("SELECT CURDATE()");
        res.send(rows);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send("Database error");
    }
});//dbTest

app.listen(3000, ()=>{
    console.log("Express server running")
})