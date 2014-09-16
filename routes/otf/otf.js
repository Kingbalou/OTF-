/**
 * Created by epa on 10/06/14.
 */

    var logger = require('log4js').getLogger('css');
    var express = require('express');
    var router = express.Router();
    var passport = require('passport');
    var url = require("url");
    //-- load annuaire file in sync mode
    var annuaire;
    annuaire = JSON.parse(require('fs').readFileSync(
            __dirname + '/otf_annuaire.json', 'utf8'));
    logger.debug("\tOTF Otf.prototype.performAction Annuaire  : \n[\n%j\n]\n",
        annuaire);
    //--
    var getControler = function (req, cb) {
        // --
        path = url.parse(req.url).pathname;
        if (!path) {
            err = "{'error':' url parse error for path [%s]',path}";
            return cb(err);
        }
        // -- GET, POST,DELETE, etc ..
        type = req.method;
        if (!type) {
            err = "{'error':' type parse error for path [%s]',path}";
            return cb(err);
        }

        // -- Authentificate flag
        auth = annuaire[type + path].auth;

        // -- check Authentificate flag
        if (auth && !req.isAuthenticated()) {
            logger.debug("\tOTF Page sécurisée,demande d'authentification. ");// redirect to loggin
            module = 'login';
            methode = 'titre';
            screen = 'login';
        } else {
           logger.debug("\tOTF Account authentifier [ account %j], [session id : [%s] ]",req.session.account,req.sessionID);// redirect to loggin
            module = annuaire[type + path].module;
            methode = annuaire[type + path].methode;
            screen = annuaire[type + path].screen;
        }
        // --
        // --
        if (module && methode && screen) {
            // -- Load module in otf_module
            instanceModule = require('./controler/' + module);
            if (!instanceModule) {
                err = "{'error':' module laod error for path [%s]',path}";
                return cb(err);
            }
        }

        //
        if (methode !== 'undefined') {
            // Merci Stéphane
            // _module contient une instance d' objet Json, niveau
            // ObjecModule
            // [module] pathName, niveau Module
            // [methode)
            action = instanceModule[module][methode];

        } else {
            action = instanceModule[module]['execute'];
        }
        // --
        // -- controler data structure
        controler = {
            'auth' : auth,
            'module' : module,
            'methode' : methode,
            'screen' : screen,
            'action' : action
        };
        // -- set session otf controler
        req.session.otf = controler;
        // -- call the callback
        //-- la variable controller est visible dans la fonction appellente
        return cb(null, controler);

    };
    //--
    var performAction = function(req, callback) {

        // --
       logger.debug("\tOTF  [ URL [type : %s], [Path : %s] ", req.method,req.url);
        // --
        // -- build controler
        getControler(req, function cb(err, controler) {
            if (err) {
                // --
                logger.debug("\tOTF getController ERROR [%j]", err);
                callback(err, null);
            } else {
                // --
                logger.debug("\tOTF controler     :  [%j]",controler);
                logger.debug("\tOTF Session.otf   :  [%j]", req.session.otf);
                //logger.debug("\tOTF Session.socketid   :  [%j]", req.session.sessionid);
                // --
                return callback(null, controler);
            }
        }); // ~ getController
    };
    // --
    var logHttpRequest = function (req, res, next) {
        logger.debug("\napp Log Handler [ %s %s ]", req.method, req.url);
        next();
    };
    // --
    // -- Signup Accounts
    // --
    var signupAccount = function (req, res, next) {
        logger.debug("\napp signup Account [ %s %s %j]", req.method, req.url,
            req.body);
        //-- Authetificate, becarefull is a function
        passport.authenticate(
            'local',
            function(err, account) {

                // next();
                if (err) {
                    logger.debug("APP authenticate  signupAccount ERROR [%s]",
                        err);
                    return next(err); // will generate a 500 error
                }
                ;
                if (!account) {
                    logger.debug("APP authenticate  signupAccount Fail ");
                    return res.redirect('/login');
                }
                // if everything's OK
                // create objects in session
                req.logIn(account, function(err) {
                    if (err) {
                        logger.debug("APP logIn ERROR   account : [%j]",
                            account);
                        req.session.messages = "Error logIn";
                        return next(err);
                    }
                   logger.debug("APP authenticate   account : [%j,  session id : [%s]]",
                        account,req.sessionID);
                    // set the message
                    req.session.messages = {
                        'title' : 'Login successfully ' + account.login
                    };

                    //- je trouve que le redirect est meilleur car sinon avec le render l'ur affichée sur le browser est toujour /signup et pas /
                    //- ou autre path dans l'annuaire
                    //return res.redirect('/');
                    return res.render('index', {'title': "Bienvenue "+req.session.account.login+" votre votre n° de session  est "+req.sessionID});
                });

            })(req, res, next);

    };
    //--
    var logOut = function(req,res){
        // delete the account session
        req.logout();
        res.redirect('/login');
    };
    // --
    // -- Traite la requête par le routeur dynamique de OTF
    // --
    var otfAction = function (req, res, next) {// attention il ne
        // --
        logger.debug('\napp.js OTF buildAction [ %s %s ]', req.method, req.url);
        // --
        performAction(req, function(err, controler) {
            if (err)
                next(err);
            else {
                /* Appel de la méthode du bean via une callback pour permettre
                * au bean d'exécuter des action asynchrone et donc ne pas bloqué
                * l'application aux autres utilisateurs */
                controler.action(function (errBean, result) {
                    logger.debug(" otf final %j", result);
                    res.render(controler.screen, result);
                });
            }

        });
    };
    // --
// -- Gestion des erreurs Si erreur lors du traitement de la requête par le
// routeur dynamique de OTF
// --
    function errorHandler(err, req, res, next) {
        logger.debug(
            "APP OTF Handler status 500 Error cause by :  \n [\n %s \n] \n",
            err.stack);
        res.status(501);
        res.render('501', {
            title : 'Http Status 501: Action not implemented',
            error : err,
            url : req.method + req.url
        });
        return; // end of treath
    };
    // --logger
    router.use(logHttpRequest);// -- LogHttpREquest
//-- Authentificate Process

    //--
router.post('/index', signupAccount);

    //-- Logout Process
    router.get('/logout', logOut);

    // -- Perform OTF Automate action
    router.use(otfAction);

    //-- Error Handler if otf throw error
    router.use(errorHandler);// -- Error Handler After Otf Treath


module.exports = router;