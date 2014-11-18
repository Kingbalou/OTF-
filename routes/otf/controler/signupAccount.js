/**
 * Created by epa on 18/11/14.
 */
var logger = require('log4js').getLogger('css');
var mongoose = require('mongoose');
var genericModel = require(__dirname + '/../../../ressources/models/mongooseGeneric');
var passport = require('passport');

/*
 * SET users datas into MongoDB.
 */

exports.signupAccount = {
    //controler.params, controler.path, controler.data_model, controler.schema, controler.room
    signup: function (req, cb) {
        // CONTROLER
        var _controler = req.session.controler;
        //@TODO not safety
        logger.debug('room   : ', _controler.room);
        logger.debug('model  : ' + _controler.data_model);
        logger.debug('params  : ', _controler.params);
        passport.authenticate(
            'local',
            function (err, account, info) {

                if (err) {
                    logger.debug("passport.authenticate  signupAccount ERROR [%s]",
                        err);
                    return next(err); // will generate a 500 error
                }
                ;
                if (!account) {
                    logger.debug("passport.authenticate  signupAccount Fail message %j", info);
                    req.session.controler.screen = 'login';
                    return cb(null, {title: 'OTF EXPRESS AUTHENTIFICATION ', state: 'false', message: info.message});
                }
                // if everything's OK
                // create objects in session
                req.logIn(account, function (err) {
                    if (err) {
                        logger.debug("passport.authenticate req.LogIn ERROR   account : [%j]",
                            account);
                        //req.session.messages = "Error logIn";
                        return cb(err);
                    }
                    logger.debug("passport.authenticate req.LogIn OK   account : [%j,  session id : [%s]]",
                        account, req.sessionID);
                    // set the message


                    //- je trouve que le redirect est meilleur car sinon avec le render l'ur affichée sur le browser est toujour /signup et pas /
                    //- ou autre path dans l'annuaire
                    return cb(null, {title: 'OTF EXPRESS ', state: 'true', user: account.login, message: " votre n° de session  est : " + req.sessionID});
                    //return res.render('index', {'title': "Bienvenue " + req.session.account.login + " votre n° de session  est : " + req.sessionID});
                });

            })(req);
    }
};