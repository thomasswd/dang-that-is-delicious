const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({

    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [ validator.isEmail, 'Invalid Email'],
        required: 'Please enter a valid email'
    },
    name: {
        type: String,
        required: 'Please enter a valid name',
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    hearts: [ //set up hearts field for the database to store the ID of a hearted store
        { 
            type: mongoose.Schema.ObjectId,
            ref: 'Store'
        }
    ]
});

userSchema.plugin( passportLocalMongoose, { usernameField: 'email'})
userSchema.plugin( mongodbErrorHandler );

userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`
})

module.exports = mongoose.model('User', userSchema);
