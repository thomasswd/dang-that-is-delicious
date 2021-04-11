const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
    res.render('login', { title: 'Log in'})
}

exports.registerForm = (req, res) => {
    res.render('register', { title: 'Register'})
}

exports.validateRegister = (req, res, next) => {

    req.sanitizeBody('name');
    req.checkBody('name', 'You must enter a valid name').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.sanitizeBody('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    }),
    req.checkBody('password', 'Password required').notEmpty();
    req.checkBody('password-confirm', 'Password confirmation required').notEmpty();
    req.checkBody('password-confirm', 'Passwords must match').equals(req.body.password);
    const errors = req.validationErrors();
    if(errors) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash()});
        return;
    }
    next();

}

exports.register = async(req, res, next) => {
    const user = new User({ email: req.body.email, name: req.body.name});

    const registerWithPromise = promisify(User.register, User);
    await registerWithPromise(user, req.body.password);

    next();
}

exports.account = (req, res) => {
    res.render('account', {title: 'Edit your acount'});
}

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };
    const user = await User.findOneAndUpdate(
        {_id: req.user._id},
        {$set: updates},
        {new: true, runValidators: true, context: 'query'}
    );
    req.flash('success', 'Successfully updated account');
    res.redirect('back');    
}