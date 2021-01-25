/* eslint-disable curly */
require("dotenv").config();
// Requiring path to so we can use relative routes to our HTML files
const db = require("../models");
const axios = require("axios");

// Requiring our custom middleware for checking if a user is logged in
const isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function (app) {
  app.get("/", (req, res) => {
    // If the user already has an account send them to the profile page
    res.render("landingpage");
  });

  app.get("/signup", (req, res) => {
    if (req.user) {
      res.redirect("/profile");
    } else {
      res.render("signup");
    }
  });

  app.get("/login", (req, res) => {
    // If the user already has an account send them to the profile page
    if (req.user) {
      res.redirect("/profile");
    } else {
      res.render("login");
    }
  });

  app.get("/profile", isAuthenticated, (req, res) => {
    db.sequelize.query("SELECT * FROM Profiles pr INNER JOIN Parks p ON pr.parkID = p.parkID WHERE userID = " + req.user.id, { 
      type: db.sequelize.QueryTypes.SELECT }).then(data => {
      const hbsObject = {
        profiles: data
      };
      console.log(hbsObject);
      res.render("profile", hbsObject);
    });
  });

  app.get("/parks", isAuthenticated, (req, res) => {
    // Get all parks
    db.Park.findAll({raw: true}).then(data => {
      data.forEach(item => {
        item.statesFormatted = item.states.split(",").join(", ");
      });
      const hbsObject = {
        parks: data
      };
      res.render("parks", hbsObject);
    });
  });

  app.get("/parks/search", (req, res) => {
    let parkName;
    let statesArr;
    let designationArr;
    let queryString = "Select * From parks Where";   

    if (req.query.name) { 
      parkName = req.query.name;
      queryString += ` name REGEXP '${parkName}'`;
      if (req.query.states || req.query.des) queryString += " AND"; 
    }

    if (req.query.states) { 
      statesArr = req.query.states.split(",");
      let stateRegex = "";
      statesArr.forEach((state, index) => {
        stateRegex += state;
        if (index < statesArr.length - 1) {
          stateRegex += "|";
        }
      }); 
      queryString += ` states REGEXP '${stateRegex}'`;
      if (req.query.des) queryString += " AND";
    }

    if (req.query.des) { 
      designationArr = req.query.des.split(",");
      let designationString = "";
      designationArr.forEach((des, index) => {
        designationString += `'${des}'`;
        if (index < designationArr.length - 1) {
          designationString += ",";
        }
      });
      queryString += ` designation IN (${designationString})`;
    }

    if (!req.query.name && !req.query.states && !req.query.des) {
      queryString = "Select * From Parks;";
    }
    console.log(queryString);

    db.sequelize.query(queryString, {
      type: db.sequelize.QueryTypes.SELECT
    })
      .then((results) => {
        results.forEach(item => {
          item.statesFormatted = item.states.split(",").join(", ");
        });
        
        const hbsObject = {
          parks: results
        };
        res.render("parks", hbsObject);
      });
  });

  app.get("/parks/:parkid", (req, res) => {
    const parkCode = req.params.parkid;
    const apiKey = process.env.APIKEY;
    const url = "https://developer.nps.gov/api/v1/parks?&api_key=" + apiKey + "&parkCode=" + parkCode;
    const paths = ["/images/loginBackground.jpg","/images/loginBackground2.jpg","/images/loginBackground3.webp"
    ];
    const arrayLength = paths.length-1;
    const randomGen = paths[Math.floor(Math.random() * arrayLength) + 1 ];
    console.log(randomGen);
    
    axios.get(url).then((response) => {
      const parkObj = response.data.data[0];
      parkObj.randomImage = randomGen;
      console.log(parkObj);
      res.render("park-detail", parkObj);
    });
  });
};