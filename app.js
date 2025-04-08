const express=require("express");
const mysql=require("mysql2");
const dotenv=require("dotenv");
const path=require("path");
const hbs=require("hbs");
const nodemailer=require("nodemailer");
const session=require("express-session");
const transporter=nodemailer.createTransport({
    service: "gmail",
    auth:{
        user: "gethired43@gmail.com",
        pass:process.env.MAIL_PASSWORD,
    },
});

dotenv.config({path:'./.env'});
const app= express();
const db=mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASSWORD,
    database:process.env.DATABASE,
    port:3310
});
const publicDirectory=path.join(__dirname,'./public');
app.use(express.static(publicDirectory));
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.set('view engine', 'hbs');
app.use(session({
    secret:'secret-key',
    resave:false,
    saveUninitialized:false,
}));
hbs.registerHelper("rawHtml", function(content){
    return new hbs.handlebars.SafeString(content);
});
db.connect((error)=>{
    if(error){
        console.log(error);
    }
    else{
        console.log("MySQL connected");
    }
});
app.get("/",(req,res)=>{
    res.render("index");
});
app.get("/signup",(req,res)=>{
    res.render("signup");
});
app.post("/signup",(req,res)=>{

    const name=req.body.name;
    const email=req.body.email;
    const job=req.body.job;
    const password=req.body.password;
    
    db.query('INSERT INTO users SET ?',{name: name, email: email, password: password, job: job},(error,results)=>{
        if(error){
            console.log(error);
        }
        else{
            
                return res.render('signup',{
                    message1: `You are signed in as ${req.body.job}`,
                    message2: "<a href='/login'>LogIn</a>"
                });

            
            
            
        }
    });
});
app.post("/login",(req,res)=>{
    const email=req.body.email;
    const name=req.body.name;
    req.session.email=req.body.email;
    req.session.name=req.body.name;
    db.query('SELECT * FROM users WHERE ?',{email:email},(error,result)=>{
        if(error){
            console.log(error);
        }
        else{
            if(result.length===0){
                res.send("account doesn't exist");
            }
            if(result[0].password===req.body.password){
                if(result[0].job==="seeker"){
                    res.render("home");

                }
                else{
                    res.render("home2");
                }
                
                
            }
            else{
                res.send("incorrect password");
            }
        }
    });
    
    
});
app.post("/home",(req,res)=>{
    db.query('UPDATE users SET ?, ? , ? WHERE ?',[{skill:req.body.skill},{skill2:req.body.skill2},{skill3:req.body.skill3},{name:req.session.name}], (error)=>{
        if(error){
            console.log(error);
        }
        else{
            db.query('SELECT name,email FROM users WHERE ? AND ( ? OR ? OR ? )',[{job:"hirer"},{skill:req.body.skill},{skill:req.body.skill2},{skill:req.body.skill3}],(error,result)=>{
                if(error){
                    console.log(error);
                }
                else{
                    let message3="";
                    for(let i=0;i<result.length;i++){
                        message3=message3+`<p class="message">Company Name: ${result[i].name}  & Company Email: ${result[i].email}</p>`;
                    }
                    let message4="";
                    for(let i=0;i<result.length;i++){
                        message4=message4+` Company Name: ${result[i].name}  &  Company Email: ${result[i].email} `;
                    }
                    const mailOptions={
                        from:"gethired43@gmail.com",
                        to: req.session.email,
                        subject: "Mail from GetHired",
                        text: `Thanks for registering on GetHired! We assure to help you in finding best job for you. These are the companies looking for skills mentioned by you:${message4}  `,
                    };
                    transporter.sendMail(mailOptions,(error,info)=>{
                        if(error){
                            console.log(error);
                        }
                        else{
                            console.log("email sent",info.response);
                        }
                    });
                   
                 return res.render('shortlist',{
                    message1: message3
                 });
                }
            });
        }

    });
})
app.get("/login",(req,res)=>{
    res.render("login");
});


app.post("/home2",(req,res)=>{
    db.query('UPDATE users SET ? WHERE ?',[{skill:req.body.skill},{email:req.session.email}],(error,result)=>{
        if(error){
            console.log(error);
        }
        else{
            res.send('<b><p style="font-size:50px">Skills Updated!</b></p>');
        }
    });

});
app.listen(3000,()=>{
    console.log("port connected");
})