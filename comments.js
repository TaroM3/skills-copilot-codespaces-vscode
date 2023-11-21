// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// Store the comments
const commentsByPostId = {};

// Handle GET requests to /posts/:id/comments
app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

// Handle POST requests to /posts/:id/comments
app.post('/posts/:id/comments', async (req, res) => {
    const comment = req.body;
    const postId = req.params.id;

    // Get the comments for the post
    const comments = commentsByPostId[postId] || [];

    // Add the new comment to the list
    comments.push(comment);

    // Store the comments
    commentsByPostId[postId] = comments;

    // Send a request to the event bus
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: comment.id,
            content: comment.content,
            postId: postId,
            status: comment.status
        }
    });

    res.status(201).send(comments);
});

// Handle POST requests to /events
app.post('/events', async (req, res) => {
    console.log('Received Event', req.body.type);

    const { type, data } = req.body;

    if (type === 'CommentModerated') {
        const { postId, id, status, content } = data;

        // Get the comments for the post
        const comments = commentsByPostId[postId];

        // Find the comment to update
        const comment = comments.find(comment => {
            return comment.id === id;
        });

        // Update the comment
        comment.status = status;

        // Send a request to the event bus
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id,
                status,
                postId,
                content
            }
        });
    }

    res.send({});
});

// Start the server
app.listen(4001, () => {
    console.log('Listening on 4001');
});
