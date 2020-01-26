const Linkedin = require('./src/linkedin');
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
  let cookie = null;
  let token = null;
  if (linkedin.jar) {
    cookie = linkedin.jar.getCookieString('https://www.linkedin.com');
    token = linkedin._getSessionCookie('https://www.linkedin.com');
  }
  const body = await linkedin.getAuth();
  let redirectUri = body.redirectUri;
  if (cookie && token && !redirectUri) {
    redirectUri = body.challenge_url;
    res.append('cookie', cookie);
    res.append('csrf-token', linkedin.token);
    const headers = linkedin.AUTH_REQUEST_HEADERS;
    Object.keys(headers).forEach((key) => {
      res.append(key, headers[key]);
    });
  }
  if (redirectUri) {
    res.redirect(redirectUri);
  } else {
    res.send(body);
  }
});

/* router.get('/auth/linkedin/callback', async (req, res) => {
  const body = await linkedin.getToken(req.query.code);
  res.json(body);
}); */

router.get('/all', async (req, res) => {
  const body = await linkedin.getAll(req.query);
  res.json(body);
});

router.get('/me', async (req, res) => {
  const body = await linkedin.getProfile();
  res.json(body);
});

router.get('/profiles/:profileId', async (req, res) => {
  const body = await linkedin.getProfile(req.params.profileId);
  res.json(body);
});

router.get('/profiles', async (req, res) => {
  const body = await linkedin.getProfiles(req.query);
  res.json(body);
});

router.get('/profiles', async (req, res) => {
  const body = await linkedin.getProfiles(req.query);
  res.json(body);
});

router.get('/jobs', async (req, res) => {
  const body = await linkedin.getJobs(req.query);
  res.json(body);
});

router.get('/contents', async (req, res) => {
  const body = await linkedin.getContents(req.query);
  res.json(body);
});

router.get('/companies/:companyId', async (req, res) => {
  const body = await linkedin.getOrganization(req.params.companyId);
  res.json(body);
});

//?filters[]=geoRegion-%3Enl%3A0&filters[]=industry-%3E4%7C96&keywords=netherlands
router.get('/companies', async (req, res) => {
  const body = await linkedin.getOrganizations(req.query);
  res.json(body);
});

router.get('/groups/:groupId', async (req, res) => {
  const body = await linkedin.getGroup(req.params.groupId);
  res.json(body);
});

router.get('/groups', async (req, res) => {
  const body = await linkedin.getGroups(req.query);
  res.json(body);
});

router.get('/schools', async (req, res) => {
  const body = await linkedin.getSchools(req.query);
  res.json(body);
});
