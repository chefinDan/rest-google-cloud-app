const uuid = require('uuid/v1')
const axios = require('axios')
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const userController = require('./user')
const clientId = require('../client_id.json').web
const { project } = require('../project')
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(project.client_id);

const scope = project.scope
var state;
const redirect_uri = (process.env.NODE_ENV === 'dev') ? clientId.redirect_uris[1] : clientId.redirect_uris[0]

module.exports.jwt = jwt({   
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: project.jwt.jwksUri
    }),
    //Validate the audience and the issuer.
    issuer: project.jwt.issuer,
    algorithms: project.jwt.algorithms
});


async function verify (token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: project.client_id,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    console.log(payload);
    return payload

}

module.exports.verifyCreds = async (req, res, next) => {
    console.log("Verifying user jwt")
    let jwt = req.get('Authorization')
    if(!jwt){
        next({'status': 400, msg: 'Authorization required to access this resource'})
        return;
    }
    var parts = jwt.split(' ');
    if (parts.length === 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            token = credentials;
            req.user_payload = await verify(credentials).catch(err => { next({status: 401, msg: 'invalid authorization token' }) });
            next();
            return;
        }
    }
   next({'status': 400, msg: 'Authorization header is malformed'})
}


module.exports.verifyLogin = async (req, res, next) => {
    console.log("Verifying token")
    let payload = await verify(req.body.idtoken)
    req.user_payload = payload
    next();
}

module.exports.loginScreen = async (req, res, next) => {
    
    console.log("Checking that user is using a browser")
    if(req.get('User-Agent').includes('Postman')){
        next({status: 403, msg: "Use a browser for this request"});
        return
    }
    res.status(200).render('login');
}

module.exports.checkAuth = async (req, res, next) => {
    console.log("Checking that user has authenticated the application");
    if(!req.user.access_token){
        console.log("Access token not found")
        state = uuid();
        let oauth_uri = `${project.jwt.authorization_endpoint}?client_id=${clientId.client_id}&redirect_uri=${redirect_uri}&scope=${project.auth.scope}&response_type=code&state=${state}`
        
        console.log("Sending oauth uri: ", oauth_uri)
        console.log("Presenting user with google oauth link")
        res.status(201).send({ authStatus: false, oauth_uri: oauth_uri });
    }
    else{
        console.log('Found access_token')
        res.status(201).send({ authStatus: true, msg: 'You have already authorized this application' });
    }
}

module.exports.redirect = async (req, res, next) => {
    console.log('GET /auth/redirect')
    let query = req.query
    console.log("User authorized google")
    try {
        if(state !== query.state)
            throw({status: 401, msg: "State does not match"})
        let token_res = await axios.post(project.jwt.token_endpoint, {
            'code': query.code,
            'client_id': clientId.client_id,
            'client_secret': clientId.client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        })
        console.log('setting access token')
        console.log(token_res)
        let payload = await verify(token_res.data.id_token)
        userController.setAccessToken(token_res.data.access_token, payload.sub);
        res.status(200).send({jwt: token_res.data.id_token});
    }
    catch(err){
        next(err)
    }
}

module.exports.uri = (req, res, next) => {
    state = uuid();
    let oauth_uri = `${project.jwt.authorization_endpoint}?client_id=${clientId.client_id}&redirect_uri=${redirect_uri}&scope=${project.auth.scope}&response_type=code&state=${state}`
    res.status(200).json({oauth_uri: oauth_uri} );
}

