const blogRouter = require("express").Router();
const Blog = require("../models/blog");
const { tokenExtractor, userExtractor } = require("../utils/middleware");

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", { username: 1, name: 1 });
  response.json(blogs);
});

blogRouter.get("/:id", async (request, response, next) => {
  const blog = await Blog.findById(request.params.id).populate("user", {
    username: 1,
    name: 1,
  });
  if (blog) return response.json(blog);
  response.status(404).end();
});

blogRouter.post(
  "/",
  tokenExtractor,
  userExtractor,
  async (request, response) => {
    if (!request.body.title || !request.body.url)
      return response.status(400).send("Title and url are mandatory");
    const user = request.user;
    const newBlog = { ...request.body, user: user._id };
    const blog = new Blog(newBlog);
    const result = await blog.save();
    await result.populate("user", { username: 1, name: 1 });
    user.blogs = user.blogs ? user.blogs.concat(result._id) : [result._id];
    await user.save();
    response.status(201).json(result);
  }
);

blogRouter.put("/:id", async (request, response) => {
  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true, context: "query" }
  ).populate("user", { username: 1, name: 1 });
  response.status(200).send(updatedBlog);
});

blogRouter.delete(
  "/:id",
  tokenExtractor,
  userExtractor,
  async (request, response) => {
    const blog = await Blog.findById(request.params.id);
    if (blog.user.toString() !== request.user.id.toString())
      return response.status(401).send("Not authorized");
    await Blog.findByIdAndRemove(request.params.id);
    response.status(204).end();
  }
);

blogRouter.post("/:id/comments", async (request, response) => {
  const blog = await Blog.findById(request.params.id);
  if (!blog) return response.status(404).send("Blog not found");
  blog.comments = blog.comments
    ? blog.comments.concat(request.body.comment)
    : [request.body.comment];
  await blog.save();
  response.status(201).json(blog);
});

module.exports = blogRouter;
