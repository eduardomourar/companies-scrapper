const querystring = require('querystring');
const client = require('unofficial-linkedin-api');
const request_promise = require('request-promise-native');
const jar = require('unofficial-linkedin-api/src/utils/cookieJar');
const cookieJar = jar.getCookieJar();
const request = request_promise.defaults({ jar: cookieJar });


const credentials = {
  user: '',
  password: '',
};

const AUTH_REQUEST_HEADERS = {
  'X-Li-User-Agent': 'LIAuthLibrary:3.2.4 com.linkedin.LinkedIn:8.8.1 iPhone:8.3',
  'User-Agent': 'LinkedIn/8.8.1 CFNetwork/711.3.18 Darwin/14.0.0',
  'X-User-Language': 'en',
  'X-User-Locale': 'en_US',
  'Accept-Language': 'en-us',
};

const AUTH_URL = 'https://www.linkedin.com/uas/authenticate';
const BASE_URL = 'https://www.linkedin.com/voyager/api';

class Linkedin {
	constructor() {
    this.user = credentials.user;
    this.jar = cookieJar;
    this.initializeToken();
  }

  async initializeToken() {
    /* await sleep(30000);
    let response = await request(
      {
        uri: AUTH_URL,
        method: 'GET',
        json: true,
        headers: AUTH_REQUEST_HEADERS,
      }
    );
    console.log('response', response);
    await sleep(randomBetween3and5);
    response = await this.getToken(credentials.user, credentials.password); */
    const response = await client.login(credentials.user, credentials.password);
    console.log('response', response);
  }

  _getSessionCookie(uri = AUTH_URL, voyager = false) {
    if (!this.jar) {
      return '';
    }
    const cookieString = this.jar.getCookieString(uri);
    if (voyager) {
        return `${cookieString.split(';')[0].split('=')[1].replace(/"/g, '')}`;
    } 
    return `"${cookieString.split(';')[1].split('=')[1]}"`;
  }

  _getRequestHeaders(headers) {
    if (!this.token) {
      throw new Error('A CSRF token is required before making this request.');
    }
    const h = new Headers({
      'referer': 'https://www.linkedin.com/feed/?trk=guest_homepage-basic_nav-header-signin',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36',
      'x-li-lang': 'en_US',
      // 'x-li-track': '{"clientVersion":"1.2.9851","osName":"web","timezoneOffset":-5,"deviceFormFactor":"DESKTOP","mpName":"voyager-web"}',
      'x-restli-protocol-version': '2.0.0',
      'accept-language': 'en-US,en;q=0.9,pt;q=0.8,es;q=0.7',
    });
    h.append('csrf-token', this.token);
    if (headers && headers.constructor === Object) {
      Object.keys(headers).forEach((key) => {
        h.append(key, headers[key]);
      });
    }
    return h;
  }

  async getToken(user, password) {
    try {
      const result = await request(
        {
          uri: AUTH_URL,
          method: 'POST',
          body: {
            'session_key': user,
            'session_password': password,
            'JSESSIONID': this._getSessionCookie(AUTH_URL),
          },
          json: true,
          headers: AUTH_REQUEST_HEADERS,
        }
      );
      this.token = await this._getSessionCookie(AUTH_URL, true);
      return result;
    } catch (error) {
      console.log('Access Token Error', error.message);
      return error;
    }
  }

  async getProfile() {
    const identifier = '';
    /* const res = await request(
      {
        uri: `${BASE_URL}/identity/profiles/${identifier}/profileView`,
        headers: this._getRequestHeaders(),
      }
    ); */
    const response = await client.getProfileById(identifier);
    return response;
  }

  async getContacts() {
    const res = await request(
      {
        uri: `${BASE_URL}/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    )
    return res.json()
  }
  
  async getCompanies() {
    const res = await request(
      {
        uri: `${BASE_URL}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&start=0&count=10&projection=(elements*(organizationalTarget~(id,localizedName,logoV2(original~:playableStreams))))`,
        headers: this._getRequestHeaders(),
      }
    )
    const companies = await res.json()

    const { elements, serviceErrorCode, message, status } = companies

    const list = []

    if (elements) {
      elements.forEach((org) => {
        const {
          'organizationalTarget~': { localizedName: name, id },
        } = org
        list.push({ name, id })
      })
    } else {
      console.error(
        'unable to retrieve companies',
        message,
        serviceErrorCode,
        status
      )
    }

    return list
  }

  async getOrganizations(query) {
    const res = await request(
      {
        uri: `${BASE_URL}/organizations?q=emailDomain&emailDomain=linkedin.com&${querystring.stringify(query)}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    return res.json();
  }

  async searchCompanies(query) {
    const res = await request(
      {
        uri: `${BASE_URL}/search?q=companiesV2&${querystring.stringify(query)}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    return res.json();
  }
}

module.exports = Linkedin;
