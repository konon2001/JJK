/**
 * Created by shinsungho on 14. 10. 25..
 */
exports.main = function(req, res ){
    console.log( 'welcome :D', req.session.username );
    res.render('main.ejs', {
        access_token : req.session.access_token,
        username : req.session.username
    });
}