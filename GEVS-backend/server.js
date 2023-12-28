const express = require('express')
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const https = require('https');
const bcrypt = require('bcrypt');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const request = require("request");
require('dotenv').config();

const app = express();
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const OAuthURL = process.env.OAUTH_URL;
const algorithm = 'aes-256-cbc';
const password1 = process.env.ENC_PASSWORD;
const key = crypto.scryptSync(password1, 'gibberish-password', 32);
const iv = Buffer.alloc(16);

for(let i=0;i<iv.length;i++){
    iv[i]=Math.pow(i+10,2);
} 

app.set("trust proxy", 1);

app.use(cors({
    origin: [process.env.ORIGIN],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: 'Content-Type, Custom-Header',
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

let election_status = 0;

const port = 3001
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_ROOT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

const hashPassword = async (password) => {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

const authorise = (req, res, next)=>{
    const decrypt1 = req.cookies.cookieValue||"token=abcd;email=abcd;";
    const decrypt2 = decrypt1.match(new RegExp(`token=([^;]+)`));
    const decrypt = decrypt2[1];
    const email1 = decrypt1.match(new RegExp(`email=([^;]+)`));
    const email = email1[1];

    try{
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
        const myCookieValue = decipher.update(decrypt, 'hex', 'utf8')+decipher.final('utf8');
        const authorizationHeader = myCookieValue;
        
        if (!authorizationHeader) {
            return res.status(401).json({ message: 'Unauthorized: Access token missing' });
        }

        pool.query(`SELECT token FROM voters WHERE voter_id="${email}"`,(err,result,fileds)=>{
            if(err){
                res.status(401).json({success:false, message:"Mysql voters login error"});
            }
            if(result.length==0){
                res.clearCookie("cookieValue");
                res.status(401).json({success:false, message:"Already logged in into other device"});
                res.end();

            }
            else{
                if(result[0].token===decrypt){
                    const token = myCookieValue;
                    try {
                        const { exp } = jwt.decode(token);
                        if (Date.now() >=( exp * 1000)) {
                            res.clearCookie("cookieValue");
                            res.status(401).json({ message: 'Unauthorized: Token expired' });
                            res.end();
                            pool.query(`UPDATE voters SET token=null WHERE voter_id="${email}"`,(err1,result1,fields1)=>{
                                if(err1){
                                    console.log("Error fetching the data from database");
                                }
                                if(result1.length==0){
                                    console.log("No data found");
                                }
                                else{
                                    console.log("Token removed");
                                }
                            });
                        }
                        next();
                    } catch (err) {
                        return res.status(401).json({ message: 'Unauthorized: Invalid access token' });
                    }
                }else{
                    res.clearCookie("cookieValue");
                    res.status(401).json({message:"Already logged in into other device"});
                    res.end();
                }
            }
        });
    }catch (error) {
        console.error('Decryption error:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }
}


app.post('/register',async (req,res)=>{
    let {email, password, full_name, DOB, constituency, uvccode} = req.body;
    password = await hashPassword(password);
    console.log(password);

    pool.query("SELECT * from voters",(err, result, fields)=>{
        if (err) {
            res.status(401).json({success:false, message:"Mysql voters error"});
        }
        const check = result.filter((result)=>{
            return result.voter_id == email;
        })
        if(!check.length){
            const uvc = true;
            pool.query(`SELECT * FROM uvc_code WHERE UVC="${uvccode}"`,(err1,result1,fields1)=>{
                if(err){
                    res.status(401).json({success:false, message:"Mysql uvccode error"});
                }   
                if(result1.length!==0)
                {
                    if(result1[0].used===1){
                        res.status(401).json({success:false, message:"UVC code already used"});
                    }
                    else{
                        pool.query(`INSERT INTO voters (voter_id, full_name, DOB, password, UVC, constituency_id) VALUES ("${email}", "${full_name}", "${DOB}", "${password}", "${uvccode}", "${constituency}" )`,(err2,result2,fields2)=>{
                            if(err2){
                                res.status(401).json({success:false, message:"Mysql insert query error"});
                            }
                            res.status(201).json({success:true, message:"You are registered"});
                            pool.query(`UPDATE uvc_code SET used=1 WHERE UVC="${uvccode}"`,(err3,result3,fields3)=>{
                                if(err3){
                                    res.status(401).json({success:false, message:"Mysql update query error"});
                                }
                            });
                        });
                    }
                }else{
                    res.status(401).json({success:false, message:"UVC code does not exist"});
                }
            });
        }
        else{
            res.status(401).json({success:false, message:"Provided e-mail address already registered"});
        }
    });
})

app.post('/login',async (req,res)=>{
    const {email, password} = req.body;

    let role;
    
    pool.query(`SELECT password, admin FROM voters WHERE voter_id="${email}"`,async (err,result,fields)=>{
        if(err){
            res.status(401).json({success:false, message:"Mysql voters login error"});
        }
        if(result.length==0){
            res.status(401).json({success:false, message:"Provided email does not registered"});
        }
        else{
            const passwordMatch = await bcrypt.compare(password, result[0].password);
            if(passwordMatch){
                if(result[0].admin === 1){
                    role = "admin";
                }else{
                    role = "user";
                }

                var options = { 
                    method: 'POST',
                    baseURL: `${OAuthURL}`,
                    url : '/oauth/token',
                    headers: { 'content-type': 'application/json' },
                    data: {
                        "client_id":`${clientId}`,
                        "client_secret":`${clientSecret}`,
                        "audience":`${OAuthURL}/api/v2/`,
                        "grant_type":"client_credentials"
                    }
                };

                axios.request(options)
                .then(res1=>{
                    const accessToken = res1.data.access_token;
                    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key),iv);
                    const encrypted = cipher.update(accessToken, 'utf8', 'hex')+cipher.final('hex'); //encryption
                    const secretKey = 'gibberish-password';
                    const finalRole = CryptoJS.AES.encrypt(role, secretKey).toString();
                    const cookieValue = `token=${encrypted};role=${finalRole};email=${email};`;

                    res.cookie('cookieValue',cookieValue,{ 
                        maxAge: 10800000, 
                        // httpOnly: true,
                        // secure: true,
                        // sameSite: "None",
                    });   //3hours
                    res.status(201).json({success:true, message:"User Authenticated"});

                    pool.query(`UPDATE voters SET token="${encrypted}" WHERE voter_id="${email}"`,(err1,result1,fields)=>{
                        if(err1){
                            console.log("Mysql voters login error");
                        }
                        if(result1.length==0){
                            console.log("No data found");
                        }
                        else{
                            //token added to database
                        }
                    })
                }).catch(err=>{
                    console.log(err);
                });
            }else{
                res.status(401).json({success:false, message:"Incorrect password"});
            }
        }
    });
})

app.get('/logout', authorise,(req,res)=>{
    const decrypt1 = req.cookies.cookieValue||"email=abcd;";
    const email1 = decrypt1.match(new RegExp(`email=([^;]+)`));
    const email = email1[1];
    pool.query(`UPDATE voters SET token=null WHERE voter_id="${email}"`,(err,result,fields)=>{
        if(err){
            console.log("Error fetching the data from database");
        }
        if(result.length==0){
            console.log("No data found");
        }
        else{
            //token removed from database
        }
    });
    res.clearCookie("cookieValue");
    res.status(201).json({success:true, message:"Successfully logged out"});
    res.end();
})


////////////////////////////////////////OPEN API START////////////////////////////////////////////////////////////////////////////////////

app.get('/gevs/constituency/:constituencyName',(req,res)=>{ 
    const constituency = req.params.constituencyName;
    
    pool.query(`SELECT constituency_id FROM constituency WHERE constituency_name="${constituency}"`, (err, result, fields)=>{
        if(err){
            res.status(401).json({message:"Error fetching the data from database"});
        }
        if(result.length==0){
            res.status(401).json({message:`No such constituency '${constituency}' found`});
        }
        else{
            const const_id = result[0].constituency_id;

            pool.query(`SELECT * FROM candidate WHERE constituency_id="${const_id}"`, (err1, result1, fields1)=>{
                if(err1){
                    res.status(401).json({message:"Error fetching the data"});
                }
                if(result1.length==0){
                    res.status(401).json({message:`No such candidate data found from constitency '${constituency}'`});
                }
                else{

                    let partyDetails;
                    pool.query("SELECT * FROM party",(err2, result2, fields2)=>{
                        if(err2){
                            res.status(401).json({message:"Error fetching the data"});
                        }
                        if(result2.length==0){
                            res.status(401).json({message:`No such candidate data found from constitency ${constituency}`});
                        }
                        else{
                            partyDetails = result2;
                            let resultArr = [];
                            for(let i=0;i<result1.length;i++){
                                let voteCount = result1[i].vote_count;
                                let candidate = result1[i].candidate;
                                let partyID = result1[i].party_id;
                                let partyName;
                                for(let j=0;j<result2.length;j++){
                                    if(result2[j].party_id === partyID){
                                        partyName = result2[j].party;
                                    }
                                }
                                
                                let item = {
                                    name:candidate,
                                    party:partyName,
                                    vote:voteCount
                                };
                                resultArr.push(item);
                            }
                            const finalData = {
                                constituency:`${constituency}`,
                                result:resultArr
                            };
                            res.status(201).json(finalData);
                        }
                    });
                }
            });
        }
    });
})


app.get('/gevs/results',(req,res)=>{

    pool.query("SELECT p.party, SUM(c.vote_count)as seat FROM candidate c join party p on c.party_id = p.party_id group by c.party_id",(err,result,fields)=>{
        if(err){
            res.status(401).json({message:"Error fetching the data"});
        }
        if(result.length==0){
            res.status(401).json({message:`No data found`});
        }
        else{
            let status,winner;
            if(election_status == 0){
                status = "Completed";
                winner = "Hung Parliament";
                let count = 0,flag=0;
                for(let i=0;i<result.length;i++){
                    count += Number(result[i].seat);
                }
                const barrier = count/2;
                console.log(barrier);
                for(let i=0;i<result.length;i++){
                    if(Number(result[i].seat)>barrier){
                        flag=1;
                        break;
                    }
                }
                let cnt=0;
                if(flag){
                    for(let i=0;i<result.length;i++){
                        if(cnt<Number(result[i].seat)){
                            cnt=Number(result[i].seat);
                            winner=result[i].party;
                        }
                    }
                }
            }else{
                status = "Pending";
                winner = "Pending"; 
            }
            const data = {
                status:status,
                winner:winner,
                seats:result
            };
            res.status(201).json(data);
        }
    });
})


/////////////////////////////////////////OPEN API END/////////////////////////////////////////////////////////////////////////////////////


app.get('/userdata', authorise,(req,res)=>{

    const cookieVal1 = req.cookies.cookieValue;
    const cookieVal2 = cookieVal1.match(new RegExp(`email=([^;]+)`));
    const cookieVal = cookieVal2[1];

    pool.query(`SELECT c.candidate, SUM(c.vote_count) AS votes, ANY_VALUE((SELECT p.party FROM party p WHERE p.party_id = c.party_id)) AS party FROM candidate c WHERE c.constituency_id = (SELECT constituency_id FROM voters WHERE voter_id = "${cookieVal}")GROUP BY c.candidate`,(err,result,fields)=>{
        if(err){
            res.status(401).json({message:"Error fetching the data"});
        }
        if(result.length==0){
            res.status(401).json({message:"No data found"});
        }else{
            pool.query(`SELECT full_name,voted,ANY_VALUE((SELECT c.constituency_name FROM constituency c WHERE c.constituency_id=v.constituency_id)) as constituency FROM voters v WHERE voter_id = "${cookieVal}"`,(err1,result1,fields1)=>{
                if(err1){
                    res.status(401).json({message:"Error fetching the data"});
                }
                if(result1.length==0){
                    res.status(401).json({message:"No data found"});
                }else{
                    pool.query(`SELECT election_status FROM election WHERE election_name="gevs"`,(errR,resultA,filedsR)=>{
                        if(errR){
                            console.log("Error fetching the data");
                        }
                        if(resultA.length==0){
                            console.log("No data found");
                        }else{
                            election_status = resultA[0].election_status;
                            if(!election_status){
                                pool.query("SELECT p.party, SUM(c.vote_count)as seat FROM candidate c join party p on c.party_id = p.party_id group by c.party_id",(err2,result2,fields2)=>{
                                    if(err2){
                                        res.status(401).json({message:"Error fetching the data"});
                                    }
                                    if(result2.length==0){
                                        res.status(401).json({message:`No data found`});
                                    }
                                    else{
                                        let winner="Hung Parliament",count = 0,flag=0;
                                        for(let i=0;i<result2.length;i++){
                                            count += Number(result2[i].seat);
                                        }
                                        const barrier = count/2;
                                        for(let i=0;i<result2.length;i++){
                                            if(Number(result2[i].seat)>barrier){
                                                flag=1;
                                                break;
                                            }
                                        }
                                        let cnt=0;
                                        if(flag){
                                            for(let i=0;i<result2.length;i++){
                                                if(cnt<Number(result2[i].seat)){
                                                    cnt=Number(result2[i].seat);
                                                    winner=result2[i].party;
                                                }
                                            }
                                        }
                                        result.push(result1);
                                        result.push({election:!election_status,winner:winner});
                                        res.status(200).json(result);
                                    }
                                });
                            }else{
                                result.push(result1);
                                result.push({election:!election_status,winner:"Pending..."});
                                res.status(200).json(result);
                            }
                        }
                    });
                }
            });
        }
    });
})

app.post('/vote', authorise,(req,res)=>{
    const party =req.body.party;
    const cookieVal1 = req.cookies.cookieValue;
    const cookieVal2 = cookieVal1.match(new RegExp(`email=([^;]+)`));
    const cookieVal = cookieVal2[1];

    pool.query(`SELECT election_status FROM election WHERE election_name="gevs"`,(errR,resultR,filedsR)=>{
        if(errR){
            console.log("Error fetching the data");
        }
        if(resultR.length==0){
            console.log("No data found");
        }else{
            election_status = resultR[0].election_status;
            if(election_status){
                pool.query(`SELECT voted FROM voters where voter_id = "${cookieVal}"`,(errV,resultV,filedsV)=>{
                    if(errV){
                        res.status(401).json({message:"Error fetching the data"});
                    }
                    if(resultV.length==0){
                        res.status(401).json({message:"No data found"});
                    }else{
                        if(resultV[0].voted==0){
                            pool.query(`UPDATE voters SET voted=1 where voter_id = "${cookieVal}"`,(err,result,fields)=>{
                                if(err){
                                    res.status(401).json({message:"Error Updating the data"});
                                }
                                if(result.length==0){
                                    res.status(401).json({message:"No data found"});
                                }else{
                                    pool.query(`UPDATE candidate SET vote_count=vote_count+1 where constituency_id=(SELECT constituency_id FROM voters WHERE voter_id = "${cookieVal}") AND party_id=(SELECT party_id FROM party where party="${party}")`,(err1,result1,fields1)=>{
                                        if(err){
                                            res.status(401).json({message:"Error Updating the data"});
                                        }
                                        if(result.length==0){
                                            res.status(401).json({message:"No data found"});
                                        }else{
                                            res.status(201).json({success:true,message:"Voted successfully"});
                                        }
                                    })
                                }
                            });
                        }else{
                            res.status(401).json({message:"You have already voted"});
                        }
                    }
                });
            }else{
                res.status(401).json({message:"Election is closed"});
            }
        }
    });
})

app.get('/election-status', authorise,(req,res)=>{

    pool.query(`SELECT election_status FROM election WHERE election_name="gevs"`,(errR,resultR,filedsR)=>{
        if(errR){
            console.log("Error fetching the data");
        }
        if(resultR.length==0){
            console.log("No data found");
        }else{
            election_status = resultR[0].election_status;
            if(!election_status){
                pool.query("SELECT p.party, SUM(c.vote_count)as seat FROM candidate c join party p on c.party_id = p.party_id group by c.party_id",(err,result,fields)=>{
                    if(err){
                        res.status(401).json({message:"Error fetching the data"});
                    }
                    if(result.length==0){
                        res.status(401).json({message:`No data found`});
                    }
                    else{
                        let winner="Hung Parliament",count = 0,flag=0;
                        for(let i=0;i<result.length;i++){
                            count += Number(result[i].seat);
                        }
                        const barrier = count/2;
                        for(let i=0;i<result.length;i++){
                            if(Number(result[i].seat)>barrier){
                                flag=1;
                                break;
                            }
                        }
                        let cnt=0;
                        if(flag){
                            for(let i=0;i<result.length;i++){
                                if(cnt<Number(result[i].seat)){
                                    cnt=Number(result[i].seat);
                                    winner=result[i].party;
                                }
                            }
                        }
                        res.status(201).json({election:election_status,winner:winner});
                    }
                });
            }else{
                res.status(201).json({election:election_status,winner:"Pending..."});
            }
        }
    });
})

app.post('/election', authorise,(req,res)=>{
    const val =req.body.val;
    election_status=Number(val);
    pool.query(`UPDATE election SET election_status=${election_status} WHERE election_name="gevs"`,(errR,resultR,filedsR)=>{
        if(errR){
            console.log("Error fetching the data");
        }
        if(resultR.length==0){
            console.log("No data found");
        }else{
            if(!election_status){
                pool.query("SELECT p.party, SUM(c.vote_count)as seat FROM candidate c join party p on c.party_id = p.party_id group by c.party_id",(err,result,fields)=>{
                    if(err){
                        res.status(401).json({message:"Error fetching the data"});
                    }
                    if(result.length==0){
                        res.status(401).json({message:`No data found`});
                    }
                    else{
                        let winner="Hung Parliament",count = 0,flag=0;
                        for(let i=0;i<result.length;i++){
                            count += Number(result[i].seat);
                        }
                        const barrier = count/2;
                        for(let i=0;i<result.length;i++){
                            if(Number(result[i].seat)>barrier){
                                flag=1;
                                break;
                            }
                        }
                        let cnt=0;
                        if(flag){
                            for(let i=0;i<result.length;i++){
                                if(cnt<Number(result[i].seat)){
                                    cnt=Number(result[i].seat);
                                    winner=result[i].party;
                                }
                            }
                        }
                        res.status(201).json({election:election_status,winner:winner});
                    }
                });
            }else{
                res.status(201).json({election:election_status,winner:"Pending..."});
            }
        }
    });
})

app.get('/admindata', authorise,(req,res)=>{
    pool.query(`SELECT c.vote_count,c.candidate , ANY_VALUE((SELECT p.party FROM party p WHERE p.party_id=c.party_id))as party, ANY_VALUE((SELECT ct.constituency_name FROM constituency ct WHERE ct.constituency_id=c.constituency_id)) as constituency FROM candidate c ORDER BY c.constituency_id`,(err,result,fields)=>{
        if(err){
            res.status(401).json({message:"Error fetching the data"});
        }
        if(result.length==0){
            res.status(401).json({message:"No data found"});
        }else{
            res.status(201).json(result);
        }
    });
})
  
app.get('/', (req, res) => res.send('Server is running'));

app.listen(process.env.PORT || port, () => console.log(`Server running on port ${port}`));
