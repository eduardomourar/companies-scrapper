const path = require('path');
const rq = require('request-promise-native');
const CookieStore = require('tough-cookie-file-store');
const cookieInstance = new CookieStore(path.join(require('os').homedir(), '.linkedin-cookie.json'));
const jar = rq.jar(cookieInstance);
const request = rq.defaults({ jar });

const { Voyager } = require('unofficial-linkedin-api');

const credentials = {
  user: process.env.EMAIL || '',
  password: process.env.PASSWORD || '',
  profileId: process.env.PROFILE_ID || '',
  publicId: process.env.PUBLIC_ID || '',
};

class Linkedin extends Voyager {
	constructor() {
    super();
    this.user = credentials.user;
    this.password = credentials.password;
    this.profileId = credentials.profileId;
    this.publicId = credentials.publicId;
    this.request = request;
    this.jar = jar;

    this.MAX_SEARCH_COUNT = 10;

    this.initializeSession();
  }

  async getAuth() {
    let response = await this.getChallenge();
    if (response === false) {
      response = await this.initializeSession();
    }
    return response;
  }

  async getAll(query = {}) {
    const response = await this.searchAll(query);
    return response;
  }

  async getProfile(profileId) {
    if (!profileId) {
      profileId = this.publicId || this.profileId;
    }
    const response = await this.getProfileById(profileId);
    return response;
  }

  async getProfiles(query = {}) {
    // query = {
    //   'filters': ['geoRegion->nl:0', 'industry->4|96'],
    //   'keywords': 'netherlands',
    // };
    const response = await this.searchProfiles(query);
    return response;
  }

  async getJobs(query = {}) {
    query = {
      'geoUrn': 'urn:li:fs_geo:90009706',
      // 'geoUrn': 'urn:li:fs_geo:102890719',
      'keywords': 'nodejs',
      // 'location': 'Netherlands',
    };
    const decoration = (
      '(' +
        'trackingId,' +
        'hitInfo(' +
          'com.linkedin.voyager.search.FacetSuggestion,com.linkedin.voyager.search.SecondaryResultContainer,' +
          'com.linkedin.voyager.search.SearchJobJserp(' +
            'descriptionSnippet,' +
            'jobPosting~(' +
              'closedAt,eligibleForReferrals,expireAt,formattedLocation,jobState,listedAt,new,sourceDomain,title,' +
              'applyingInfo(' +
                'applied,appliedAt,appliedTime,closed,viewedByJobPosterAt' +
              '),' +
              'applyMethod(' +
                'com.linkedin.voyager.jobs.OffsiteApply,com.linkedin.voyager.jobs.SimpleOnsiteApply,com.linkedin.voyager.jobs.ComplexOnsiteApply' +
              '),' +
              'companyDetails(' +
                'company,com.linkedin.voyager.jobs.JobPostingCompanyName,' +
                'com.linkedin.voyager.jobs.JobPostingCompany(' +
                  'company~(' +
                    'description,industries,name,staffCountRange,universalName,' +
                    'companyIndustries(*(' +
                      'localizedName' +
                    '))' +
                  ')' +
                ')' +
              '),' +
              'description(' +
                'text' +
              '),' +
              'savingInfo(' +
                'saved,savedAt' +
              ')' +
            ')' +
          ')' +
        ')' +
      ')'
      /* '(hitInfo(com.linkedin.voyager.search.SearchJobJserp(descriptionSnippet,' +
      'jobPosting~(description(text),savingInfo,title,formattedLocation,applyingInfo,' +
      'new,jobState,sourceDomain,applyMethod(com.linkedin.voyager.jobs.OffsiteApply,' +
      'com.linkedin.voyager.jobs.SimpleOnsiteApply,com.linkedin.voyager.jobs.ComplexOnsiteApply),' +
      'listedAt,expireAt,closedAt,companyDetails(com.linkedin.voyager.jobs.JobPostingCompany(' +
      'company~(companyIndustries,description,industries,name,staffCountRange,universalName)),' +
      'com.linkedin.voyager.jobs.JobPostingCompanyName),eligibleForReferrals)),' +
      'com.linkedin.voyager.search.FacetSuggestion,com.linkedin.voyager.search.SearchCompany,' +
      'com.linkedin.voyager.search.SearchJob,com.linkedin.voyager.search.SearchProfile,' +
      'com.linkedin.voyager.search.SearchSchool,com.linkedin.voyager.search.SecondaryResultContainer),trackingId)' */
    );
    // query.decoration = decoration;
    const response = await this.searchJobs(query);
    return response;
  }

  async getContents(query = {}) {
    const response = await this.searchContents(query);
    return response;
  }

  async getOrganization(organizationId = '1035') {
    const response = await this.getCompanyById(organizationId);
    return response;
  }

  async getOrganizations(query = {}) {
    query = {
      // 'filters': ['geoRegion->nl:0', 'industry->4|96'],
      'geoUrn': 'urn:li:fs_geo:90009706',
      ...query,
    };
    const response = await this.searchCompanies(query);
    return response;
  }

  async getGroup(groupId = '3') {
    const response = await this.getGroupById(groupId);
    return response;
  }

  async getGroups(query = {}) {
    const response = await this.searchGroups(query);
    return response;
  }

  async getSchools(query = {}) {
    const response = await this.searchSchools(query);
    return response;
  }
}

module.exports = Linkedin;
