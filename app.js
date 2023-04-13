import express from "express";
import dotenv from "dotenv";
import { getOptions, createPost, getPosts, getPost } from "./notion.js";
dotenv.config();

const app = express();
app.set("views", "views");
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

let tags = [];
let authors = [];
getOptions().then(({ tags: tagList, authors: authorList }) => {
  tags = tagList;
  authors = authorList;
});
setTimeout(async () => {
  getOptions().then(({ tags: tagList, authors: authorList }) => {
    tags = tagList;
    authors = authorList;
  });
}, 3_600_000);

app.get("/", async (req, res) => {
  const posts = await getPosts();
  res.render("pages/index", { posts });
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const post = await getPost(id);
  res.render("pages/post", { post });
});

app.get("/new", async (req, res) => {
  res.render("pages/new", { tags, authors });
});

app.post("/create-post", async (req, res) => {
  const { title, tags = [], authors } = req.body;
  await createPost({
    title,
    tags: (Array.isArray(tags) ? tags : [tags]).map((tag) => ({ id: tag })),
    authors: authors,
  });
  res.redirect("/");
});

app.use((req, res, next) => {
  res.status(404).render("pages/404");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server is running on port 8080");
});
