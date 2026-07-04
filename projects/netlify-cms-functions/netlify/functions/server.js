const serverless = require('serverless-http'); //追加
const express = require('express');

const app = express();

const router = express.Router();
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello from root!',
  });
});

app.use('/.netlify/functions/server', router);

module.exports = app; //追加
module.exports.handler = serverless(app); //追加

// For more info, check https://docs.netlify.com/functions/build-with-javascript
/*
module.exports.handler = async function(event, context) {
  console.log("queryStringParameters", event.queryStringParameters)
  return {
    // return null to show no errors
    statusCode: 200, // http status code
    body: JSON.stringify({
      msg: "Hello, World! This is better " + Math.round(Math.random() * 10)
    })
  }
}
*/
// Now you are ready to access this API from anywhere in your Gatsby app! For example, in any event handler or lifecycle method, insert:
// fetch("/.netlify/functions/hello")
//    .then(response => response.json())
//    .then(console.log)
// For more info see: https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#static-dynamic-is-a-spectrum
