const mongoose = require('mongoose');
const supertest = require('supertest')
const app = require('../app');
const Blog = require('../models/blog') 
const User = require('../models/user') 
const api = supertest(app)
const bcrypt = require('bcrypt')

const initialBlogs = [
    {
        title: "React patterns",
        author: "Michael Chan",
        url: "https://reactpatterns.com/",
        likes: 7,
    },
    {
        title: "Go To Statement Considered Harmful",
        author: "Edsger W. Dijkstra",
        url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
        likes: 5,
    },
    {
        title: "Canonical string reduction",
        author: "Edsger W. Dijkstra",
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
        likes: 12,
    },
    {
        title: "First class tests",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
        likes: 10,
    },
    {
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 0
    },
    {
        title: "Type wars",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2
    } 
]

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(initialBlogs)
})

describe("when there are initially some blogs saved", () => {
    test("api returns correct amount of blogs", async () => {
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(initialBlogs.length)
    }, 100000)
    
    test("unique identifier property of the blog posts is named id", async () => {
        const response = await api.get('/api/blogs')
        expect(response.body[0].id).toBeDefined()
    })
})

describe("adding a new blog to the list", () => {
    let token = null
    beforeEach(async () => {
        await User.deleteMany({})
        await api.post('/api/users').send({username: 'root', name: 'root', password: 'sekret'})
        const request = await api.post('/api/login').send({username: 'root', password: 'sekret'})
        token = request.body.token
    })
    test("successfully adds a new blog to the list", async () => {
        const newBlog = {
            title: "Test",
            author: "Test author",
            url: "http:/testurl.html",
            likes: 0,
        }
    
        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
    
        const response = await api.get('/api/blogs')
        expect(response.body).toHaveLength(initialBlogs.length + 1)
        expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(newBlog)]))
    })
    
    test("if not given, number of likes defaults to zero", async () => {
        const newBlog = {
            title: "Test",
            author: "Test author",
            url: "http:/testurl.html",
        }
        
        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)
            .expect(res => expect(res.body.likes).toBe(0))
    
    })
})

describe('returns 400 bad request when', () => {
    let token = null
    beforeEach(async () => {
        await User.deleteMany({})
        await api.post('/api/users').send({username: 'root', name: 'root', password: 'sekret'})
        const request = await api.post('/api/login').send({username: 'root', password: 'sekret'})
        token = request.body.token
    })
    test('title is missing', async () => {
        const newBlog = {
            author: "Test author",
            url: "http:/testurl.html",
            likes: 0
        }
        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(400)
        })
    
    test('url is missing', async () => {
        const newBlog = {
            title: "Test",
            author: "Test author",
            likes: 0
        }
        await api
            .post('/api/blogs')
            .set('Authorization', `bearer ${token}`)
            .send(newBlog)
            .expect(400)
    })
})

test("successfully updates blog in the list", async () => {
    await User.deleteMany({})
    await api.post('/api/users').send({username: 'root', name: 'root', password: 'sekret'})
    const request = await api.post('/api/login').send({username: 'root', password: 'sekret'})
    token = request.body.token
    const allBlogs = await api.get('/api/blogs')
    const blogToUpdate = allBlogs.body[0]
    const updatedBlog = {
        ...blogToUpdate,
        likes: blogToUpdate.likes + 1
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', `bearer ${token}`)
        .send(updatedBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
        .expect(res => expect(res.body).toEqual(updatedBlog))

    const response = await api.get('/api/blogs')
    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining(updatedBlog)]))

})

test("successfully deletes a blog in the list", async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    await api.post('/api/users').send({username: 'root', name: 'root', password: 'sekret'})
    const request = await api.post('/api/login').send({username: 'root', password: 'sekret'})
    const token = request.body.token

    const newBlog = {
        title: "Test",
        author: "Test author",
        url: "http:/testurl.html",
        likes: 0,
    }
    const blogToDelete = await api
        .post('/api/blogs')
        .set('Authorization', `bearer ${token}`)
        .send(newBlog)
        .expect(201)

    await api
        .delete(`/api/blogs/${blogToDelete.body.id}`)
        .set('Authorization', `bearer ${token}`)
        .expect(204)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(0)
    expect(response.body).not.toEqual(expect.arrayContaining([expect.objectContaining(blogToDelete)]))

})

describe('when there is initially one user in db', () => {
    test('creation succeeds with a fresh username', async () => {
      const usersAtStart = await User.find({})
      usersAtStart.map(u => u.toJSON())
  
      const newUser = {
        username: 'mluukkai',
        name: 'Matti Luukkainen',
        password: 'salainen',
      }
  
      await api
        .post('/api/users')
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /application\/json/)
  
      const usersAtEnd = await User.find({})
      usersAtEnd.map(u => u.toJSON())
      expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)
  
      const usernames = usersAtEnd.map(u => u.username)
      expect(usernames).toContain(newUser.username)
    })
  })

describe("user creation fails when", () => {
    beforeEach(async () => await User.deleteMany({}))

    test('username already taken', async () => {
        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })    
        await user.save()

        const usersAtStart = await User.find({})
        
        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen',
        }
    
        const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
    
        expect(result.body.error).toContain('Username already in use')
    
        const usersAtEnd = await User.find({})
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test("password is missing", async () => {
        const usersAtStart = await User.find({})

        const result = await api
            .post('/api/users')
            .send({ name: "Superuser", username: 'root' })
            .expect(400)

        expect(result.body.error).toContain('Username and/or password missing')

        const usersAtEnd = await User.find({})
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test("username is missing", async () => {
        const usersAtStart = await User.find({})

        const result = await api
            .post('/api/users')
            .send({ name: "Superuser", password: 'sekret' })
            .expect(400)
            
        expect(result.body.error).toContain('Username and/or password missing')

        const usersAtEnd = await User.find({})
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test("username is shorter than 3 characters", async () => {
        const usersAtStart = await User.find({})

        const result = await api
            .post('/api/users')
            .send({ name: "Superuser", username: "to", password: 'sekret' })
            .expect(400)
            
        expect(result.body.error).toContain('Username and/or password too short')

        const usersAtEnd = await User.find({})
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
    test("password is shorter than 3 characters", async () => {
        const usersAtStart = await User.find({})

        const result = await api
            .post('/api/users')
            .send({ name: "Superuser", username: "Superuser", password: 'to' })
            .expect(400)
            
        expect(result.body.error).toContain('Username and/or password too short')

        const usersAtEnd = await User.find({})
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})