const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
const Review = mongoose.model('Review')
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');


const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter( req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/')
        if(isPhoto) {
            next(null, true)
        } else {
            next({ message: `file type isn't allowed`}, false)
        }
    }
}

exports.homePage = (req, res) => {
    res.render('index')
}

exports.addStore = (req, res) => {
    res.render('editStore', {title: 'Add Store'})
} 

exports.createStore = async (req, res) => {
    //res.json(req.body)
    req.body.author = req.user._id;
    const store = await(new Store(req.body)).save();
    //await store.save();
    req.flash('success', `Successfully created a store ${store.name}. Want to leave a review?`)
    res.redirect(`/store/${store.slug}`);
}

exports.getStores = async (req, res) => {
    //need to get the current page, maximum number of stores to show per page, skip - the number of stores to skip in order to show the correct amount on the current page
    const page = req.params.page || 1;
    const limit = 6;
    const skip = (limit * page) - limit;

    const storesPromise = Store.find().skip(skip).limit(limit).sort( {create: 'desc'} );
    const countPromise = Store.count() //the total number of stores

    const [stores, count] = await Promise.all([storesPromise, countPromise])

    const pages = Math.ceil(count / limit);

    if(!stores.length && skip) {
        req.flash('info', `Page doesn't exist`);
        res.redirect(`/stores/page/${pages}`);
        return;
    }

    res.render('stores', {title: 'Stores', stores, count, page, pages});
}

const confirmOwner = (store, user) => {
    if(!store.author.equals(user._id)) {
        throw Error('You must own a store to edit it.')
    }
}

exports.editStores = async (req, res) => {
    //res.send(req.params)

    const store = await Store.findOne({_id: req.params.id});

    confirmOwner(store, req.user)

    res.render('editStore', {title: `Edit ${store.name}`, store});
}

exports.updateStore = async (req, res) => {
    //if you don't have this then after updating the address of a store, the location type wont be 'point' anymore
    req.body.location.point = 'Point';

    const store = await Store.findOneAndUpdate({_id: req.params.id}, req.body, {
        new: true,
        runValidators: true
    }).exec();

    req.flash('success', `Successfully updated ${store.name}. <a href="/store/${store.slug}">View Store</a>`);

    res.redirect(`/stores/${req.params.id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {

    const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');
    if(!store) {
        next();
        return;
    }
    res.render('store', {store, title: store.name})

}

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {

    if(!req.file) {
        next();
        return;
    }

    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;

    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`public/uploads/${req.body.photo}`);
    next();

}

exports.getStoresByTag = async(req, res) => {

    const tag = req.params.tag;

    const tagQuery = tag || { $exists: true }
    
    const tagsPromise = await Store.getTagsList();

    const storesPromise = await Store.find( { tags: tagQuery });

    const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);

    res.render('tag', { tags, title: 'Tags', tag, stores })
}

exports.searchStores = async(req, res) => {
    const stores = await Store
    .find({
        $text: {
            $search: req.query.q
        }
     }, 
     {
        score: { $meta: 'textScore' }
     }).sort({
        score: { $meta: 'textScore' }
    }).limit(5);

    res.json(stores)
}

// exports.mapStores = async(req, res) => {
//     const coordinates = [req.query.lng, req.query.lat].map[parseFloat];

//     const q = {
//         location: {
//             $near: {
//                 $geometry: {
//                     type: 'Point',
//                     coordinates
//                 }
//             }
//         }
//     }

//     const stores = await Store.find(q)
//     res.json(stores)
// }

exports.heartStore = async (req, res) => {
    //get the array of ids of hearted stores from the current user
    const hearts = req.user.hearts.map(obj => obj.toString());
    //get the operator to tell mongoDB whether or not to delete or add to the schema
    const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
    //search mongoDB for the id of the current user and either delete or add the store ID from the hearts field
    const user = await User.findByIdAndUpdate(req.user._id, 
        {[operator]: {hearts: req.params.id} },
        {new: true}
    );
    res.json(user)
}

exports.getHearts = async(req, res) => {
    console.log(req.user._id)

    const stores = await Store.find({
        _id: { $in: req.user.hearts }
    })

    res.render('stores', {title: 'Favorite Stores', stores})
}

exports.getTopStores = async(req, res) => {
    const stores = await Store.getTopStores();
    res.render('topStores', { stores, title: 'Top Stores'})
}