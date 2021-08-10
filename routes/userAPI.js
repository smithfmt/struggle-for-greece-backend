const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client")
const userController = require("../controllers/userController");
const answerController = require("../controllers/answerController");
const passport = require("passport");
router.use(express.json());
const jwt = require("jsonwebtoken");
const { slugify } = require("../helpers");

const prisma = new PrismaClient();

// Api is Working //

router.get("/", function(req, res, next) {
  res.send(`userAPI is working properly :)`);
});

// Routes

router.post("/signup",
  userController.validateSignup,
  userController.signup,
);

router.post("/login", 
  userController.validateLogin,
  userController.login,
);

router.get("/dashboard",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        wordlists: true,
      },
    });
    delete user.hash;
    delete user.salt;
    res.status(200).json({ success: true, msg: `Welcome to your Dashboard`, user })
  },
);  

router.post("/create",
  passport.authenticate("jwt", {session: false}), 
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { wordlist, title, langs } = req.body.wordlist;
    if (!title) {
      res.status(401).json({ success: false, msg: `No Title Submitted` });
    } else {
      const ref = slugify(title)
      const result = await prisma.wordlist.create({
        data: {
          title: title,
          langs: langs,
          reference: ref,
          userId: id,
        },
      });
      wordlist.map((item) => {
        item.wordlistId = result.id
      });
      await prisma.wordlist_item.createMany({
        data: [
          ...wordlist
        ],
      });
      res.status(200).json({ success: true, msg: `Successfully Posted to DB` })
    };
  },
);

router.get("/edit",
  passport.authenticate("jwt", {session: false}), 
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id),
      },
      include :{
        words: true,
      },
    });
    if (id === wordlist.userId) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.put("/edit",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    console.log(req.body)
    const jwtId = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, title, langs, id, wordlist, toDelete } = req.body;
    if (jwtId === userId) { 
      if (!title) {
        res.status(401).json({ success: false, msg: `No Title Submitted` });
      } else {
        await prisma.wordlist.updateMany({
          where: {
            userId: userId,
            id: parseInt(id),
          },
          data: {
            title: title,
            langs: langs,
            reference: slugify(title),
          },
        });
        wordlist.forEach(async entry => {
          if (entry.wordlistId) {
            await prisma.wordlist_item.update({
              where: {
                id: entry.id,
              },
              data: {
                word: entry.word,
                translation: entry.translation,
              },
            });
          } else {
            await prisma.wordlist_item.create({
              data: {
                ...entry,
                wordlistId: parseInt(id),
              }, 
            });
          };
        });
        if (toDelete) {
          toDelete.forEach(async id => {
            await prisma.wordlist_item.delete({
              where: {
                id
              },
            });
          });
        };
        res.status(200).json({ success: true, msg: "Successfully Updated your wordlist!" });
      };
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.delete("/edit",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const { userId, wordlistId } = req.query;
    if (id === parseInt(userId)) {
      await prisma.wordlist_item.deleteMany({
        where: {
          wordlistId: parseInt(wordlistId),
        },
      });
      await prisma.wordlist.delete({
        where: {
          id: parseInt(wordlistId),
        },
      });
      res.status(200).json({ success: true, msg: "Successfully Deleted your wordlist!" });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.get("/play",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id),
      },
      include :{
        words: true,
      },
    });
    if (id === wordlist.userId) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },  
);

router.post("/answer",
  passport.authenticate("jwt", {session: false}),
  answerController.checkAnswer 
);

router.get("/stats",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlistItems = await prisma.wordlist_item.findMany({
      where :{
        wordlistId: parseInt(req.query.id),
      },
      include :{
        test_answers: true,
      },
    });
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id),
      },
    });
    if (wordlist.userId === id) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlistItems });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.get("/dynamic",
  passport.authenticate("jwt", {session: false}),
  async (req, res, next) => {
    const id = jwt.decode(req.headers.authorization.split(" ")[1]).sub;
    const wordlistItems = await prisma.wordlist_item.findMany({
      where :{
        wordlistId: parseInt(req.query.id),
      },
      include :{
        test_answers: true,
      },
    });
    const wordlist = await prisma.wordlist.findUnique({
      where :{
        id: parseInt(req.query.id),
      },
      include :{
        words: true,
      },
    });
    if (wordlist.userId === id) {
      res.status(200).json({ success: true, msg: "Here is your wordlist!", wordlist, wordlistItems });
    } else {
      res.status(401).json({ success: false, msg: "This wordlist does not belong to this user!" });
    };
  },
);

router.put("/profile",
  passport.authenticate("jwt", {session: false}),
  userController.validateUpdate,
  userController.updateProfile,
);

module.exports = router;
