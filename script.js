const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const User = require('./usermodel');
const app = express();

require('dotenv').config();
mongoose.connect('mongodb+srv://garvkhullar:HflicMnT6FCO2Hf9@fakemoneytransfer.iqcqmvl.mongodb.net/?retryWrites=true&w=majority&appName=fakemoneytransfer');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'banking-secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  const users = await User.find();
  const user = req.session.user;
  res.render('index', { user, users });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.send('User already exists');
  const user = new User({ username, password, balance: 1000 });
  await user.save();
  req.session.user = user;
  res.redirect('/');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.send('Invalid credentials');
  req.session.user = user;
  res.redirect('/');
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.post('/transfer', async (req, res) => {
  const fromUser = await User.findOne({ username: req.session.user.username });
  const toUser = await User.findOne({ username: req.body.to });
  const amount = parseInt(req.body.amount);

  if (fromUser.balance < amount) return res.send('Insufficient balance');

  fromUser.balance -= amount;
  toUser.balance += amount;

  await fromUser.save();
  await toUser.save();

  req.session.user = fromUser;
  res.redirect('/');
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
