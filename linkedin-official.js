const fetch = require('node-fetch');
const querystring = require('querystring');

const credentials = {
  client: {
      id: 'sample-key',
      secret: 'sample-secret'
  },
  auth: {
      tokenHost: 'https://www.linkedin.com',
      tokenPath: 'https://www.linkedin.com/oauth/v2/accessToken',
      authorizePath: '/oauth/v2/authorization',
  },
  options: {
    authorizationMethod: 'body',
  }
};
const BASE_URL = 'https://api.linkedin.com/v2';

const oauth = require('simple-oauth2').create(credentials);

class Linkedin {
	constructor() {
		this.clientId = credentials.client.id;
    this.clientSecret = credentials.client.secret;
    this.redirectUri = 'http://localhost:8080/auth/linkedin/callback';
    this.scope = 'r_basicprofile rw_organization';// 'r_liteprofile r_emailaddress w_member_social rw_organization';
  }

  async getAuth() {
    return oauth.authorizationCode.authorizeURL({
        response_type: 'code',
        redirect_uri: this.redirectUri,
        state: 'linkedinAuthState',
        scope: this.scope,
    });
  }

  async initializeToken() {
    const token = await this.getToken();
    this.accessToken = token.access_token;
    console.log('token', this.accessToken);

    const companies = linkedin.getCompanies();
    console.log('got companies', companies);
  }

  async getToken(code) {
/*     const res = await fetch(
      `https://www.linkedin.com/oauth/v2/accessToken?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=authorization_code&code=${code}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    return res.json() */

    try {
      const result = await oauth.authorizationCode.getToken({
        code: code,
        redirect_uri: this.redirectUri,
        scope: this.scope,
      });
      const object = oauth.accessToken.create(result);
      this.accessToken = object.token.access_token;
      return result;
    } catch (error) {
      console.log('Access Token Error', error.message);
      return error;
    }
  }

  async getProfile() {
    const res = await fetch(
      `${BASE_URL}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Connection': 'Keep-Alive',
        },
      }
    )
    const profile = await res.json()

    const {
      profilePicture: { 'displayImage~': displayImage = {} } = {},
    } = profile

    const { elements = [] } = displayImage

    elements.forEach((element) => {
      if (element.identifiers) {
        element.identifiers.forEach((identifier) => {
          if (!profile.picture) {
            profile.picture = identifier.identifier
          }
        })
      }
    })

    return profile
  }

  async getContacts() {
    const res = await fetch(
      `${BASE_URL}/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    )
    return res.json()
  }
  
  async getCompanies() {
    const res = await fetch(
      `${BASE_URL}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&start=0&count=10&projection=(elements*(organizationalTarget~(id,localizedName,logoV2(original~:playableStreams))))`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
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
    const res = await fetch(
      `${BASE_URL}/organizations?q=emailDomain&emailDomain=linkedin.com&${querystring.stringify(query)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );
    return res.json();
  }

  async searchCompanies(query) {
    const res = await fetch(
      `${BASE_URL}/search?q=companiesV2&${querystring.stringify(query)}`,
      {
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
