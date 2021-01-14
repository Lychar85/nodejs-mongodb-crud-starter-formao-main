//IMPORT MODULES--------------------------------------------
const express = require('express'),
    port = 4000,
    multer = require('multer'),
    path = require('path'),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    exphbs = require("express-handlebars"),
    Handlebars = require("handlebars"),
    methodOverride = require('method-override'),
    app = express();
app.use(methodOverride("_method"));


//ajout image--------------------------------------------
app.use(express.static("public"));


const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            console.log(file);
            cb(null, './public/uploads')
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '_' + file.originalname)
        },
    }),
    //filtre image-----------
    upload = multer({
        storage: storage,
        /*limits: {
            fileSize: 1
        },*/
        fileFilter: (req, file, cb) => {
            if (
                file.mimetype === 'image/png' ||
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/jpg' ||
                file.mimetype === 'image/svg+xml' ||
                file.mimetype === 'image/svg' ||
                file.mimetype === 'image/gif'
            ) {
                cb(null, true)
            } else cb(new Error('le fichier doit être au format png,jpeg,jpg,gif.'))
        }
    });
//--------------------------------------------
const {
    allowInsecurePrototypeAccess
} = require('@handlebars/allow-prototype-access');
const {
    error
} = require('console');



// Handlebars--------------------------------------------
app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname: 'hbs',
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', 'hbs')

// BodyParser--------------------------------------------
app.use(bodyParser.urlencoded({
    extended: true
}));


//CONNEXION A MONGODB--------------------------------------------
mongoose.connect(
    "mongodb://localhost:27017/boutiqueGames", {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    (err) => {
        if (!err) console.log("MongoDB connect");
        else console.log("connect error:" + err);
    }
);

//Modeles--------------------------------------------
const productModel = {
    marque: String,
    modele: String,
    price: Number,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category"
    },
    image: {
        name: String,
        originalName: String,
        path: String,
        creatAt: Date
    }
};
const categoryModel = {
    type: String
};
const imageModel = {
    type: String
};


const product = mongoose.model("product", productModel);
const category = mongoose.model("category", categoryModel);
const image = mongoose.model("image", imageModel);

// Routes index--------------------------------------------
app.route("/")
    .get((req, res) => {
        product
            .find()
            .populate("category")
            .exec((err, docs) => {
                if (!err) {

                    category.find((err, cat) => {
                        res.render('index', {
                            product: docs,
                            category: cat
                        })
                    })


                } else {
                    res.send('err')
                }
            })
    })

    .post(upload.single("image"), (req, res) => {
        const file = req.file;
        console.log(file);

        const newProduct = new product({
            marque: req.body.marque,
            modele: req.body.modele,
            price: req.body.price,
            category: req.body.category
        });
        if (file) {
            newProduct.image = {
                name: file.filename,
                originalname: file.originalname,
                path: file.path.replace("public", ""),
                creatAt: Date.now()
            }
        }
        newProduct.save((err) => {
            if (!err) {
                res.redirect("/")
            } else {
                res.send(err)
            }
        })
    })

    .delete((req, res) => {
        product.deleteMany((err) => {
            if (!err) {
                res.redirect("/")
            } else res.send(err)
        })
    });

// route categorie--------------------------------------------
app.route("/category")
    .get((req, res) => {


        category.find((err, cat) => {
            if (!err) {
                res.render('category', {
                    category: cat
                })
            } else {
                res.send('err')
            }
        })
    })

    .post((req, res) => {
        const newCatergory = new category({
            type: req.body.type
        })
        newCatergory.save((err) => {
            if (!err) {
                res.redirect("/category")
            } else res.send(err)
        });
    })

//route ID--------------------------------------------
app.route('/:id')
    .get((req, res) => {
        product.findOne({
            _id: req.params.id
        }, (err, docs) => {
            if (!err) {
                category.find((err, cat) => {
                    res.render('edition', {
                        _id: docs.id,
                        marque: docs.marque,
                        modele: docs.modele,
                        price: docs.price,
                        category: cat,
                        image: docs.image
                    })
                })

            } else {
                res.send(err)
            }
        })
    })

 //METTRE A JOUR-------- 
    .put((req, res) => {
        product.updateOne(
            //condition------------
            {
                _id: req.params.id
            },
            //update------------
            {
                marque: req.body.marque,
                modele: req.body.modele,
                price: req.body.price,
                category: req.body.category,
                image: req.body.image
            },
            //option------------
            {
                multi: true
            },

            (err) => {
                if (!err) {
                    res.redirect('/')
                } else {
                    res.send(err)
                }
            }
        )
    })

    .delete((req, res) => {
        product.deleteOne({
            _id: req.params.id
        }, (err, ) => {
            if (!err) {
                res.redirect('/')

            } else {
                res.send(err)
            }
        })
    });


//OUVRE LE PORT 4000
app.listen(port, function () {
    console.log("écoute le port 4000");

})