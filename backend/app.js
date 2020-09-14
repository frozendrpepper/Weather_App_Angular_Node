const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

const app = express();

// Body parser Set up
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Resolve header and CORS issues
app.use((req, res, next) => {
    // This gets rid of CORS issue when Angular and Node talk to each other
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
       'Access-Control-Allow-Headers', 
       'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    next();
})

app.get('/auto', (req, res) => {
    // Middleware that handles the autocomplete request
    const autoUrl1 = "https://maps.googleapis.com/maps/api/place/autocomplete/json?input=";
    const autoUrl2 = "&types=(cities)&language=en&key=   [[API Key]]   ";
    let autoResponse = req.query.curInput;
    let autoUrl = autoUrl1 + autoResponse + autoUrl2;
    axios.get(autoUrl).then((response) => {
        // The error json is handled on Angular's typescript side
        res.json(response['data']);
    }, (error) => {
        res.send("Autocomplete Error");
    })
})

app.get('/daily', (req, res) => {
    // Middleware that handles the search button response
    // If a value is undefined, it is returned as string 'undefined' not
    // javascript special object undefined
    console.log(req.query);
    var street = req.query.street;
    var street_split = street.split(" ");
    var city = req.query.city;
    var city_split = city.split(" ");
    var state = req.query.state;
    var hidden_lattitude = req.query.hidden_lattitude;
    var hidden_longitude = req.query.hidden_longitude;
    var hidden_city = req.query.hidden_city;
    var hidden_state = req.query.hidden_state;
    var hidden_timezone = req.query.hidden_timezone;
    var googleApiKey = "[[API Key]]";
    // Choose which state information will be used for custom image search
    var customState = "";
    if (state === "undefined") {
        customState = hidden_state;
    } else {
        customState = state;
    }
    // This mapping is used to find the full name of state apparently it is much better
    // for search image results
    var stateMapping = {
              "AL": "Alabama",
              "AK": "Alaska",
              "AZ": "Arizona",
              "AR": "Arkansas",
              "CA": "California",
              "CO": "Colorado",
              "CT": "Conneticut",
              "DE": "Delaware",
              "DC": "District of Columbia",
              "FL": "Florida",
              "GA": "Georgia",
              "HI": "Hawaii",
              "ID": "Idaho",
              "IL": "Illinois",
              "IN": "Indiana",
              "IA": "Iowa",
              "KS": "Kansas",
              "KY": "Kentucky",
              "LA": "Louisiana",
              "ME": "Maine",
              "MD": "Maryland",
              "MA": "Massachusetts",
              "MI": "Michigan",
              "MN": "Minnesota",
              "MS": "Mississippi",
              "MO": "Missouri",
              "MT": "Montana",
              "NE": "Nebraska",
              "NV": "Nevada",
              "NH": "New Hamshire",
              "NJ": "New Jersey",
              "NM": "New Mexico",
              "NY": "New York",
              "NC": "North Carolina",
              "ND": "North Dakota",
              "OH": "Ohio",
              "OK": "Oklahoma",
              "OR": "Oregon",
              "PA": "Pennsylvania",
              "RI": "Rhode Island",
              "SC": "South Carolina",
              "SD": "South Dakota",
              "TN": "Tennesse",
              "TX": "Texas",
              "UT": "Utah",
              "VT": "Vermont",
              "VA": "Virginia",
              "WA": "Washington",
              "WV": "West Virginia",
              "WI": "Wisconsin",
              "WY": "Wyoming"
    };
    var stateMapped = stateMapping[customState];
    var customKey = "[[API Key]]";
    var customId = "[[API Key]]";
    var customUrl = "https://www.googleapis.com/customsearch/v1?q=";
    // customUrl += "Seal of " + stateMapped + "%20State%20Seal&cx=" + customId;
    customUrl += customState + "%20State%20Seal&cx=" + customId;
    customUrl += "&imgSize=huge&imgType=news&num=1&searchType=image&key=" + customKey;
    var lattitude = "";
    var longitude = "";
    var googleUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    // As mentioned above, javascript special object undefined is returned passed
    // as String to Express.js. So the condition is checked against string
    // The state and city conditions are also necessary because server is handling
    // requests from favorite component which only sends state and city data
    if (state !== "undefined" && city !== "undefined") {
        // This is where user typed in the address manually and we have to call geocode api
        // First compile google url
        // Attach Street First
        for (let i = 0; i < street_split.length; i++) {
            if (i == street_split.length - 1) {
                googleUrl += street_split[i];
            } else {
                googleUrl += street_split[i] + "+";
            }
        }
        googleUrl += ",+";

        // Attach City First
        for (let i = 0; i < city_split.length; i++) {
            if (i == city_split.length - 1) {
                googleUrl += city_split[i]
            } else {
                googleUrl += city_split[i] + "+";
            }
        }
        googleUrl += ",+";

        // Attach State
        googleUrl += state + "&key=" + googleApiKey;
        axios.get(googleUrl, {validateStatus: false}).then((response) => {
            if ((!response['data']['error_message']) && (response['data']['results'].length != 0)) {
                // Handle proper json response here and call second api
                lattitude = response['data']['results'][0]['geometry']['location']['lat'];
                longitude = response['data']['results'][0]['geometry']['location']['lng'];
                // Call darksky api here using lattitude and longitude
                // Since these calls are async calls make sure all the same actions
                // are handled within same scope of Observable responses or you start
                // getting funky errors. Additionally, using Promise.all to make both
                // darksky and custom image search api calls s.t async calls are handled
                // simultaneously.
                let darkUrl = "https://api.darksky.net/forecast/";
                let darkApi = "[[API Key]]";
                darkUrl += darkApi + "/";
                darkUrl += lattitude + "," + longitude;

                // These variables store the promises [for dark sky and custom image serach]
                // and returned json
                var result = [];
                // var promises = [];
                // promises.push(axios.get(darkUrl));
                // promises.push(axios.get(customUrl));
                // axios.all(promises).then((results) => {
                axios.get(darkUrl, {validateStatus: false}).then(response => {
                    // for (let i = 0; i < results.length; i++) {
                    //     result.push(results[i]['data']);
                    // }
                    result.push(response['data']);
                    axios.get(customUrl, {validateStatus: false}).then(response => {
                        result.push(response['data']);
                        res.json(result);
                    })
                })
            } else {
                // Handle error json for google geocodeapi here.
                // Handle it by directly returning the error json and let
                // Angular handle the error
                res.json(response['data']);
            }
        });
    } else {
        // This is where the user used checkbox and we use apiKey
        lattitude = hidden_lattitude;
        longitude = hidden_longitude;

        let darkUrl = "https://api.darksky.net/forecast/";
        let darkApi = "[[API Key]]";
        darkUrl += darkApi + "/";
        darkUrl += lattitude + "," + longitude;

        // Make multi api call using axios.all and promises
        var result = [];
        axios.get(darkUrl, {validateStatus: false}).then(response => {
            result.push(response['data']);
            axios.get(customUrl, {validateStatus: false}).then(response => {
                result.push(response['data']);
                res.json(result);
            })
        })
    }
})

app.get('/modal', (req, res) => {
    // Separate Api call for making the Modal Window
    var lattitude = req.query.modal_lattitude;
    var longitude = req.query.modal_longitude;
    var time = req.query.time;
    let darkUrl = "https://api.darksky.net/forecast/";
    let darkApi = "[[API Key]]";
    darkUrl += darkApi + "/";
    darkUrl += lattitude + "," + longitude + "," + time;
    axios.get(darkUrl).then((response) => {
        res.json(response['data']);
    })
})

app.listen(3000);