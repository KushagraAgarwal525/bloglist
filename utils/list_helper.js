var _ = require('lodash');

const dummy = (blogs) => 1

const totalLikes = (blogs) => blogs.reduce((likes, blog) => likes + blog.likes, 0)

const favoriteBlog = (blogs) => blogs.reduce((favorite, blog) => (favorite.likes > blog.likes) ? favorite : blog, {})

const mostBlogs = (blogs) => {
    const authorKeys = _.mapValues(_.groupBy(blogs, 'author'), _.size)
    return Object.keys(authorKeys).reduce((max, author) => (max.blogs > authorKeys[author]) ? max : {"author": author, "blogs": authorKeys[author]}, {})
}

const mostLikes = (blogs) => {
    const authorLikes = _.mapValues(_.groupBy(blogs, 'author'), o => _.sumBy(o, 'likes'))
    return Object.keys(authorLikes).reduce((max, author) => (max.likes > authorLikes[author]) ? max : {"author": author, "likes": authorLikes[author]}, {})
}

module.exports = {dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes}