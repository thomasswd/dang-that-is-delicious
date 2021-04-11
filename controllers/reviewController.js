const mongoose = require('mongoose');
const Review = mongoose.model('Review');
const Store = mongoose.model('Store')

exports.addReview = async(req, res) => {
    req.body.author = req.user._id;
    req.body.store = req.params.id;

    const store = await Store.findOne({
        _id: req.body.store
    });

    const newReview = new Review(req.body);
    await newReview.save();
    req.flash('success', `Successfully submitted a review for ${store.name}`)
    res.redirect('back');
}