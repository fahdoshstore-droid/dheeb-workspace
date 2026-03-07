#!/usr/bin/env node
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
    console.log('RECEIVED:', JSON.stringify(req.body));
    res.json({ success: true, received: req.body });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(3000, () => console.log('Running on 3000'));
