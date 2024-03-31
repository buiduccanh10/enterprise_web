var express = require("express");
var router = express.Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const fs = require("fs");
const path = require("path");
var PostModel = require("../model/post");
var ReportModel = require("../model/report");
var SpecializedModel = require("../model/specialized");

router.get("/", async function (req, res, next) {
  const post = await PostModel.find({ isPending: false });
  const specialized = await SpecializedModel.find({});

  res.render("home/home", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: req.session.email,
  });
});

router.get("/postCreate", function (req, res, next) {
  res.render("student/postCreate", {
    layout: "layout",
    student: req.session.email,
  });
});

router.post("/upload", multipartMiddleware, (req, res) => {
  try {
    let fileName = Date.now() + req.files.upload.name;
    fs.readFile(req.files.upload.path, function (err, data) {
      const newPath = path.join(__dirname, "../public/uploads/", fileName);
      fs.writeFile(newPath, data, function (err) {
        if (err) console.log({ err: err });
        else {
          console.log(req.files.upload.originalFilename);

          let url = "/uploads/" + fileName;
          let msg = "Upload successfully";
          let funcNum = req.query.CKEditorFuncNum;
          console.log({ url, msg, funcNum });

          const script =
            "<script>window.parent.CKEDITOR.tools.callFunction('" +
            funcNum +
            "','" +
            url +
            "','" +
            msg +
            "');</script>";

          res.status(201).send(script);
        }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/post", async function (req, res) {
  const { title, content } = req.body;

  var post = {
    title: title,
    body: content,
    dateCreate: Date.now(),
    isPending: true,
    email: req.session.email,
  };
  await PostModel.create(post);

  res.redirect("/");
});

router.get("/report/:id", async function (req, res, next) {
  const post = await PostModel.findById(req.params.id);
  res.render("student/report", {
    layout: "layout",
    post: post,
    student: req.session.email,
  });
});

router.post("/report/:id", async function (req, res, next) {
  const contentrp = req.body.reporttext;
  const currentDate = new Date();
  const localDateTime = new Date(currentDate.getTime() + 7 * 60 * 60 * 1000);

  const report = {
    content: contentrp,
    comment: null,
    dateCreate: localDateTime,
    isPending: true,
    email: req.session.email,
    postID: req.params.id,
  };

  await ReportModel.create(report);

  res.redirect("/");
});

router.get("/reportedPost", async function (req, res, next) {
  const report = await ReportModel.find({ email: req.session.email }).lean();
  if (report) {
    const reportWithPost = await Promise.all(
      report.map(async (report) => {
        const post = await PostModel.findById(report.postID);
        return { ...report, post: post };
      })
    );
    res.render("student/reportedPost", {
      layout: "layout",
      report: reportWithPost,
      student: req.session.email,
    });
  }
});

router.get("/myPost", async function (req, res, next) {
  const myPost = await PostModel.find({ email: req.session.email }).lean();

  res.render("student/myPost", {
    layout: "layout",
    post: myPost,
    student: req.session.email,
  });
});

module.exports = router;
