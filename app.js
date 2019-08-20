const Linkedin = require('./linkedin');
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express(bodyParser.json());
const cors = require('cors');
const port = 8080;

app.use('/', router);

app.set('json spaces', 2);

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.listen(port, (err, req, res) => {
  if (err) return console.log(`Something bad has happen : ${err}`);
  console.log(`Server listening at port ${port}`);
});

const linkedin = new Linkedin();

router.get('/auth', async (req, res) => {
  const redirectUri = await linkedin.getAuth();
  res.redirect(redirectUri);
});

router.get('/auth/linkedin/callback', async (req, res) => {
  const body = await linkedin.getToken(req.query.code);
  res.json(body);
});

router.get('/me', async (req, res) => {
  const body = await linkedin.getProfile();
  res.json(body);
});

router.get('/companies', async (req, res) => {
  // const body = await linkedin.searchCompanies(req.query);
  const body = await linkedin.getOrganizations();
  res.json(body);
});
