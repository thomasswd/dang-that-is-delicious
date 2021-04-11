const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs')

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.type
    },
    location: {
        type: {  
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must provide valid coordinates'
        }],
        address: {
            type: String,
            required: 'You must enter a valid address'
        }
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'Author Required'
    }
}, {
    toJSON: { vituals: true },
    toObject: { vituals: true }
});

storeSchema.index({
    name: 'text',
    description: 'text'
});


// storeSchema.index({
//     location: '2dsphere'
// });   

storeSchema.pre('save',  async function(next) {
    if(!this.isModified('name')) {
        next();
        return;
    }

    this.slug = slug(this.name);
 
    //use regex to turn the current slug in to a regex expression
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    //check the constructor to see if any other slugs match with the slug regex and if there are, they are saved into an array
    const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
    //if there are items in the slug array, then take the length of the array and add that number to the original slug with '-length+1'
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

storeSchema.statics.getTagsList = function() {
    return this.aggregate( [
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ])
};

storeSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'store'
});

storeSchema.statics.getTopStores = function() {
    return this.aggregate([
        {$lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'store',
            as: 'reviews'
        }},
        {$match: {'reviews.1': {$exists: true }}},
        {$project : {
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            reviews: '$$ROOT.slug',
            slug: '$$ROOT.slug',
            averageRating: {$avg: '$reviews.rating'}
        }},
        {$sort: { averageRating: -1}},
        {$limit: 10}
    ])
}

function autopopulate(next) {
    this.populate('reviews');
    next()
}

storeSchema.pre('find', autopopulate);
storeSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Store', storeSchema);