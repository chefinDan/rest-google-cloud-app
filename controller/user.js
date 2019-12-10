const userService = require('../service/userService');

exports.getAccessToken = () => {
    return access_token; 
}

module.exports.login = async (req, res, next) => {
    console.log("Logging in user with sub: ", req.user_payload);
    let user = await userService.getBySub(req.user_payload.sub)
    if(!user){
        console.log('Creating new user: ')
        req.user = await userService.createUser(req.user_payload);
    }
    else{
        req.user = user;
    }
    next()
}

module.exports.setAccessToken = async (access_token, sub) => {
    console.log("Setting access token for user: ", sub)
    let user = await userService.getBySub(sub);
    console.log("Found user: ", user);
    user.access_token = access_token;
    await userService.update(user);
}

module.exports.getUser = async (req, res, next) => {
    console.log("Getting user");
    try{
        let user = await userService.getBySub(req.user_payload.sub)
        console.log("Found user: ", user);
        req.user = user;
        next();
    }
    catch(err){
        next(err);
    }
    
}