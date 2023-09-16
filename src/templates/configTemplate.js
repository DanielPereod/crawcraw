module.exports = {
  //Exclude hosts from crawler
  exclude_hosts: [],

  //Exclude text from crawler urls
  exclude_text: [],
  
  //Block request urls
  block_request: [],

  //Intercept requests checks
  interceptedRequests: [
    {
      name: "Example",
      url: "www.example.com",
    },
  ],
  //Scripts checks
  scripts: {
    example: async function (page, checkName) {
      return {
        checkName,
        result: "OK",
        data: { test: "this is an example" },
      };
    },
  },
};
