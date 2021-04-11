const passport = require('passport');
const mongoose = require('mongoose')
const User = mongoose.model('User');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
    failureFlashRedirect: '/login',
    failureFlash: 'Failed Login',
    successRedirect: '/',
    successFlash: 'You have logged in'
});

exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Successfully logged out');
    res.redirect('/')
}

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) {
        next();
        return
    }
    req.flash('error', 'You must be logged in');
    res.redirect('/login')
}

exports.forgot = async (req, res) => {
    const user = await User.findOne({email: req.body.email});

    if(!user) {
        req.flash('error', 'Could not fulfill request. Password reset link has been mailed');
        return res.redirect('/login');
    }

    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;
    //need to add these fields to mongoose userSchema

    await user.save();
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;

    await mail.send({
        user,
        subject: 'Password Reset',
        resetURL,
        filename: 'password-reset'
    })

    req.flash('success', `You've been sent a password reset link`);
    res.redirect('/login');
}

exports.reset = async (req, res) => {
    // check if token exists
    // check if token has expired

    const user = User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now()}
    })

    if(!user) {
        req.flash('error', 'invalid or expired token');
        res.redirect('/login')
    }
    res.render('reset', { title: 'Reset your password'})
}

exports.confirmedPasswords = (req, res, next) => {
    if(req.body.password === req.body['password-confirm']) {
        next();
        return;
    }
    req.flash('error', 'Passwords do not match');
    res.redirect('back');
}

exports.update = async(req, res) => {

    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    })

    if(!user) {
        req.flash('error', 'invalid or expired token');
        return res.redirect('/login')
    }

    const setPassword = promisify(user.setPassword, user);
    await setPassword(req.body.password)

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    const updatedUser = await user.save();
    await req.login(updatedUser);

    req.flash('success', 'Successfully updated password');
    res.redirect('/')

}