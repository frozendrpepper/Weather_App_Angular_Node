import { Component, OnInit, ElementRef } from '@angular/core';
import { InputService } from '../../services/input.service';
import { InputdailyService } from '../../services/inputdaily.service';
import { DailymodalService } from '../../services/dailymodal.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import './chartjs-plugin-datalabels.min';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-daily',
  templateUrl: './daily.component.html',
  styleUrls: ['./daily.component.css']
})
export class DailyComponent implements OnInit {
  hidden_lattitude: string = 'N/A';
  hidden_longitude: string = 'N/A';
  hidden_city: string = 'N/A';
  hidden_state: string = 'N/A';
  hidden_timezone: string = 'N/A';
  // Form data
  get_data: any;
  auto_data: any;
  // Automatic length of number of cities to show for autocomplete
  auto_length: number = 5;
  // Json returned from daily response
  dailyResponseJson: any = [];
  // Json returned from autocomplete
  auto_response: any = [];
  // Top 5 cities from autocomplete
  auto_city: any = [];
  error_message: string = "";
  showProgress: boolean;

  // Properties unique to DailyComponent Here
  // Store input daily response json in this variable
  inputJson: any;
  // Save input data from InputComponent
  inputData: any;
  // Image data from custom search
  inputImage: any;

  // Save timezone information for time conversion
  timeZone: string;

  // Variables for current information
  curCity: string = 'N/A';
  curState: string = 'N/A';
  curTimezone: string = 'N/A';
  curTemp: string = 'N/A';
  curSum: string = 'N/A';
  curHumid: any;
  curP: any;
  curWind: any;
  curVis: any;
  curCloud: any;
  curOzone: any;

  // variables used for hourly data
  hourlyLength: number = 24;
  hourlyTime: number [] = [];
  hourlyTemp: number [] = [];
  hourlyP: number [] = [];
  hourlyHumid: number [] = [];
  hourlyOzone: number [] = [];
  hourlyVis: number [] = [];
  hourlyWind: number [] = [];

  // Variables that store instantiation of the hourly charts
  // and weeklyHidden is a boolean Array used to control which of the
  // charts is shown under hourly nav bar
  tempChart;
  pChart;
  humidChart;
  ozoneChart;
  visChart;
  windChart;
  weeklyHidden: boolean[] = [true, false, false, false, false, false]

  // variables for weekly data
  weeklyUnixTime = [];
  weeklyTime = [];
  weeklyTempLow = [];
  weeklyTempHigh = [];
  weeklyChart;
  weeklyTemp = []

  // get longitude and lattitude as you need them to call Modal api call
  modal_latitude: any;
  modal_longitude: any;
  modal_index: any;

  // Twitter URL
  twitterUrl: string;

  // Variables for handling error
  errorMessage: string;
  isError: boolean;

  // Variables used for input
  inputStreet: any;
  inputCity: any;
  inputState: any;
  inputCheck: any;

  // With error code handle there is a bit of problem
  // the daily response showing without complete parsing the data
  // use this variable to control that. We also need to apply slightly different
  // logic for showProgress to make the progress bar last until we set isRendered
  // to be true
  isRendered: boolean;

  // This variable keeps track of whether the current city is already favorited
  isFavorite: boolean;

  constructor(private inputService: InputService, private inputdailyService: InputdailyService,
              private router: Router, private modal: NgbModal,
              private dailymodalService: DailymodalService) { }

  ngOnInit() {
    this.isRendered = false;
    // Emtpy all chart
    // Important thing is that any Array that was used to compile results needs to
    // be re-instatntiated to empty array
    this.isError = true;
    // Disable Progress bar
    this.showProgress = true;
    this.hourlyTime = [];
    this.hourlyTemp = [];
    this.hourlyP = [];
    this.hourlyHumid = [];
    this.hourlyOzone = [];
    this.hourlyVis = [];
    this.hourlyWind = [];

    // Charts need to be destroyed so they don't keep information
    // from old chart instances. Declaring them as empty array is not good enough
    if (this.tempChart) {
      this.tempChart.destroy();
      // this.tempChart = [];
    }
    if (this.pChart) {
      this.pChart.destroy();
      // this.pChart = [];
    }
    if (this.humidChart) {
      this.humidChart.destroy();
      // this.humidChart = [];
    }
    if (this.ozoneChart) {
      this.ozoneChart.destroy();
      // this.ozoneChart = [];
    }
    if (this.visChart) {
      this.visChart.destroy();
      // this.visChart = [];
    }
    if (this.windChart) {
      this.windChart.destroy();
      // this.windChart = [];
    }

    this.weeklyUnixTime = [];
    this.weeklyTime = [];
    this.weeklyTempLow = [];
    this.weeklyTempHigh = [];

    if (this.weeklyChart) {
      this.weeklyChart.destroy();
      // this.weeklyChart = []; 
    }
    this.weeklyTemp = [];
    // 
    this.weeklyHidden = [true, false, false, false, false, false]
    // Get IpApi input
    this.inputService.getIpApi().subscribe(ipOutput => {
      this.hidden_lattitude = ipOutput["lat"];
      this.hidden_longitude = ipOutput["lon"];
      this.hidden_city = ipOutput["city"];
      this.hidden_state = ipOutput["region"];
      this.hidden_timezone = ipOutput["timezone"];
    })

    // Receive Json from input
    this.inputJson = this.inputdailyService.exportJson();

    // Receive Form input data
    this.inputData = this.inputdailyService.exportInput();

    // // Put the input form info back to current form
    this.preserveInput(this.inputData);
    
    // Check to see if there are any errors, if there are the template
    // has logic to take care of it
    var error_result = this.checkError(this.inputJson);
    this.isError = error_result[0];
    this.errorMessage = error_result[1];

    if (this.isError !== true) {
      // Set up some initial classes for navbar and dropdown
      // This logic needs to go outside error stuff
      (<HTMLInputElement>document.getElementById('current-tab')).className = "nav-link active";
      (<HTMLInputElement>document.getElementById('hourly-tab')).className = "nav-link";
      (<HTMLInputElement>document.getElementById('weekly-tab')).className = "nav-link";
      (<HTMLInputElement>document.getElementById('home')).className = "tab-pane fade show active chart";
      (<HTMLInputElement>document.getElementById('profile')).className = "tab-pane fade chart";
      (<HTMLInputElement>document.getElementById('contact')).className = "tab-pane fade chart";
      (<HTMLInputElement>document.getElementById('hourlySelect')).value = "0";

      // Extract city depending on which source it comes from
      var city = "";
      if (this.inputData.city === undefined) {
        city = this.inputData.hidden_city;
      } else {
        city = this.inputData.city; 
      }

      // Check whether this city is inside favorite
      this.checkFavorite(city);

      // Also figure out which one is the correct state. We need this for localstorage
      var state = "";
      if (this.inputData.state === undefined) {
        state = this.inputData.hidden_state;
      } else {
        state = this.inputData.state;
      }

      // Extract timezone data
      if (this.inputJson[0]['timezone'] === undefined) {
        this.timeZone = this.inputData.hidden_timezone;
      } else {
        this.timeZone = this.inputJson[0]['timezone'];
      }

      // Extract longitude and lattitude for modal component
      this.modal_latitude = this.inputJson[0]['latitude'];
      this.modal_longitude = this.inputJson[0]['longitude'];

      this.parseCurrent(this.inputJson, city, state);
      this.parseHourly(this.inputJson);
      this.parseWeekly(this.inputJson, this.timeZone);
      this.showProgress = false;
      this.isRendered = true;
    }
  }

  preserveInput(inputJson) {
    if (inputJson.street === undefined ||inputJson.street === "") {
      this.inputStreet = "";
      this.inputCity = "";
      this.inputState = "";
      this.inputCheck = true;
    } else if (inputJson.street === "undefined") {
      this.inputStreet = "";
      this.inputCity = inputJson.city;
      this.inputState = inputJson.state;
      this.inputCheck = false;
    } else {
      this.inputStreet = inputJson.street;
      this.inputCity = inputJson.city;
      this.inputState = inputJson.state;
      this.inputCheck = false;
    }
  }

  // Check if any of the json returns an error and set up appropriate
  // error_message and boolean isError
  checkError(jsonData) {
    var isError = false;
    var errorMessage = "No error";
    if (jsonData['error_message']) {
      // Google geocode error
      isError = true;
      errorMessage = jsonData['error_message'];
    } else if (jsonData['status'] === "ZERO_RESULTS") {
      // Zero result error
      isError = true;
      errorMessage = "Zero Result Returned";
    } else if (jsonData[0]['error']) {
      // DarkSky error
      isError = true;
      errorMessage = jsonData[0]['error'];
    } else if (jsonData[1]['error']) {
      // Custom Search Error
      isError = true;
      errorMessage = jsonData[1]['error']['message'];
    }
    var final_result = []
    final_result.push(isError);
    final_result.push(errorMessage);
    // If there is an error message, progress bar should go away otherwise
    // it should stay on until rendering is done inside ngOnInit
    if (isError === true) {
      this.showProgress = false;
    } else {
      this.showProgress = true;
    }
    return final_result;
  }

  // Here are funcitons unique to daily component
  // Let us create separate functions for parsing different parts
  // current, hourly and weekly
  parseCurrent(jsonData, curCity, curState) {
    //jsonData contains both daily and custom image search where
    // daily information is indexed at 0
    var currentData = jsonData[0]["currently"];
    this.curCity = curCity;
    this.curState = curState;
    this.curTemp = Math.round(parseInt(currentData["temperature"], 10)).toString();
    this.curSum = currentData["summary"];
    // Need to make sure values exist or we don't need to display
    if (currentData["humidity"]) {
      this.curHumid = currentData["humidity"];
    } else {
      this.curHumid = false;
    }
    if (currentData["pressure"]) {
      this.curP = currentData["pressure"];
    } else {
      this.curP = false;
    }
    if (currentData["windSpeed"]) {
      this.curWind = currentData["windSpeed"];
    } else {
      this.curWind = false;
    }
    if (currentData["visibility"]) {
      this.curVis = currentData["visibility"];
    } else {
      this.curVis = false;
    }
    if (currentData["cloudCover"]) {
      this.curCloud = currentData["cloudCover"];
    } else {
      this.curCloud = false;
    }
    if (currentData["ozone"]) {
      this.curOzone = currentData["ozone"];
    } else {
      this.curOzone = false;
    }

    // Parse custom search image
    this.inputImage = jsonData[1]['items'][0]['link'];

    // Parse Twitter url
    var fahrenheit = String.fromCharCode(8457);
    this.twitterUrl = "https://twitter.com/intent/tweet?text=";
    this.twitterUrl += "The current temperature at " + this.curCity + " is " + this.curTemp;
    this.twitterUrl += fahrenheit + ". The weather conditions are " + this.curSum + ". " + "&hashtags=" + "CSCI571WeatherSearch";
  } // parseCurrent

  parseHourly(jsonData) {
    var hourlyData = jsonData[0]['hourly']['data'];
    // Implement convertTime to get actual time
    var time = 0
    for (let i = 0; i < this.hourlyLength; i++) {
      this.hourlyTime.push(time);
      // Make sure the data being added is type float not string
      this.hourlyTemp.push(parseFloat(hourlyData[i]["temperature"]));
      this.hourlyP.push(parseFloat(hourlyData[i]["pressure"]));
      this.hourlyHumid.push(100 * parseFloat(hourlyData[i]["humidity"]));
      this.hourlyOzone.push(parseFloat(hourlyData[i]["ozone"]));
      this.hourlyVis.push(parseFloat(hourlyData[i]["visibility"]));
      this.hourlyWind.push(parseFloat(hourlyData[i]["windSpeed"]));
      time += 1;
    }
    // Instantiate temp, pressure, humidity, ozone, visibility and windspeed charts
    this.tempChart = new Chart('tempChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "temperature",
          data: this.hourlyTemp,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: Math.max(0, Math.round(Math.min(...this.hourlyTemp)) - 4),
              max: Math.round(Math.max(...this.hourlyTemp)) + 5
              // stepSize: Math.round(((Math.round(Math.max(...this.hourlyTemp)) + 5) - Math.max(0, Math.round(Math.min(...this.hourlyTemp)) - 4)) / 10)
            },
            scaleLabel: {
              display: true,
              labelString: "Fahrenheit",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })
    
    this.pChart = new Chart('pChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "pressure",
          data: this.hourlyP,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: Math.round(Math.min(...this.hourlyP)) - 10,
              max: Math.round(Math.max(...this.hourlyP)) + 10,
              // stepSize: Math.round((Math.round(Math.max(...this.hourlyP)) + 10 - Math.round(Math.min(...this.hourlyP)) - 10) / 10)
            },
            scaleLabel: {
              display: true,
              labelString: "Millibars",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })

    this.humidChart = new Chart('humidChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "humidity",
          data: this.hourlyHumid,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: Math.round(Math.min(...this.hourlyHumid)) - 5,
              max: Math.round(Math.max(...this.hourlyHumid)) + 5,
              // stepSize: Math.round((Math.round(Math.max(...this.hourlyHumid)) + 5 - Math.round(Math.min(...this.hourlyHumid)) - 5)/10)
            },
            scaleLabel: {
              display: true,
              labelString: "% Humidity",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })

    this.ozoneChart = new Chart('ozoneChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "ozone",
          data: this.hourlyOzone,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: Math.max(0, Math.round(Math.min(...this.hourlyOzone)) - 20),
              max: Math.round(Math.max(...this.hourlyOzone)) + 20,
              // stepSize: Math.round((Math.round(Math.max(...this.hourlyOzone)) + 20 - Math.max(0, Math.round(Math.min(...this.hourlyOzone)) - 20)) / 10)
            },
            scaleLabel: {
              display: true,
              labelString: "Dobson Units",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })

    this.visChart = new Chart('visChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "visibility",
          data: this.hourlyVis,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: 0,
              max: Math.round(Math.max(...this.hourlyVis)) + 2,
              margin: 100
            },
            scaleLabel: {
              display: true,
              labelString: "Miles (Maximum 10)",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })

    this.windChart = new Chart('windChart', {
      type: 'bar',
      data: {
        labels: this.hourlyTime,
        datasets: [{
          label: "wind speed",
          data: this.hourlyWind,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          datalabels: {
              display: false,
          },
        },
        legend: {
          onClick: (e) => e.stopPropagation()
        },
        scales: {
          yAxes: [{
            ticks: {
              min: Math.max(0, Math.round(Math.min(...this.hourlyWind)) - 2),
              max: Math.round(Math.max(...this.hourlyWind)) + 2,
              // stepSize: Math.round((Math.round(Math.max(...this.hourlyWind)) + 2 - Math.max(0, Math.round(Math.min(...this.hourlyWind)) - 2))/10)
            },
            scaleLabel: {
              display: true,
              labelString: "Miles per Hour",
              fontSize: 15,
              padding: {
                bottom: 6
              }
            }
          }],
          xAxes: [{
            scaleLabel: {
              display: true,
              labelString: "Time difference from current hour",
              fontSize: 15
            }
          }]
        }
      }
    })
  } // parseHourly

  parseWeekly(jsonData, timezone) {
    var weeklyData = jsonData[0]['daily']['data'];
    for (let i = 0; i < weeklyData.length; i++) {
      // Time needs to be converted
      var tempTemp = [];
      var unixTime = weeklyData[i]['time'];
      // The unix time is stored because we need it when calling Modal component API call
      this.weeklyUnixTime.push(unixTime);
      var parsedTime = this.convertTime(unixTime, timezone);
      this.weeklyTime.push(parsedTime);
      tempTemp.push(weeklyData[i]['temperatureLow']);
      tempTemp.push(weeklyData[i]['temperatureHigh']);
      this.weeklyTemp.push(tempTemp);
    }
    this.weeklyChart = new Chart('weeklyChart', {
      type: 'horizontalBar',
      data: {
        labels: this.weeklyTime,
        datasets: [{
          datalabels: {
            labels: {
              minTemp: {
                anchor: 'start',
                align: 'left',
                formatter: function(value) {
                  return Math.round(value[0])
                },
              }, 
              maxTemp: {
                anchor: 'end',
                align: 'right',
                formatter: function(value) {
                  return Math.round(value[1])
                }
              }
            }
          },
          label: "Day wise temperature range",
          data: this.weeklyTemp,
          backgroundColor: 'rgba(136, 197, 235, 1)',
          borderColor: 'rgba(136, 197, 235, 1)',
          borderWidth: 1
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event, array) => {
          // This was an extremely crucial point. When I called the onClick function
          // just doing onClick: this.fun and define the func outside as a regular function
          // the function that is called is out of scope and cannot recognize any of Angular's
          // property or methods. The arrow function allows you to access information out of scope
          var getIndex = parseInt(array[0]['_index'], 10);
          this.modal_index = getIndex;
          this.modalParse();
        },
        events: ['click', 'mousemove'],
        scales: {
          xAxes: [{
            gridLines: {
              drawOnChartArea: false
            },
            scaleLabel: {
              display: true,
              labelString: "Temperature in Fahrenheit"
            }
          }],
          yAxes: [{
            display: true,
            barThickness: 20,
            maxBarThickness: 20,
            // categoryPercentage: 1.0,
            // barPercentage: 1.0,
            gridLines: {
              drawOnChartArea: false
            },
            scaleLabel: {
              display: true,
              labelString: "Days"
            }
          }]
        }
      }
    })
  } // parseWeekly

  modalParse() {
    var modal_data = {
      modal_lattitude: this.modal_latitude,
      modal_longitude: this.modal_longitude,
      time: this.weeklyUnixTime[this.modal_index]
    }

    this.dailymodalService.getDaily(modal_data).subscribe(output => {
      /* Need to make sure to write a method inside daily Component that can handle
      different error message json keys from different APIs */
      var modalOutput = output;
      // Pass the json data 
      this.dailymodalService.extractModalData(modalOutput);
      // Pass the city information to modal.component
      this.dailymodalService.extractCity(this.curCity);
      // Open up the modal that was imported from modal.component
      this.modal.open(ModalComponent);
    })
  } // modalParse()

  // This function is used to convert time to current timezone
  convertTime(timestamp, timezone){
    // Converts the UNIX timestamp returned by json to actual timeline
    var tmp = new Date(timestamp * 1000).toLocaleString("en-US", {timeZone: timezone});
    var returnString = "";
    var newDate = new Date(tmp);
    var date = newDate.getDate();
    var month = newDate.getMonth() + 1;
    var year = newDate.getFullYear();
    returnString += date.toString() + "/" + month.toString() + "/" + year.toString();
    return returnString
  }

  // This funcion handles the logic for toggling hourly data
  showGraph(dropValue) {
    var valueToIdmap = {
      '0': "tempChart",
      '1': "pChart",
      '2': "humidChart",
      '3': "ozoneChart",
      '4': "visChart",
      '5': "windChart"
    }
    for (let i = 0; i < this.weeklyHidden.length; i++) {
      if (i.toString() === dropValue) {
        this.weeklyHidden[i] = true;
      } else {
        this.weeklyHidden[i] = false;
      }
    }
    (<HTMLInputElement>document.getElementById(valueToIdmap[dropValue])).focus();
  }

  // These are same methods from InputComponent
  dailyResponse(form: NgForm) {
    // The first statement is to hide any dangling error
    this.isError = false;
    this.isRendered = false;
    this.showProgress = true;
    this.get_data = 
      {hidden_lattitude: this.hidden_lattitude, 
      hidden_longitude: this.hidden_longitude,
      hidden_city: this.hidden_city,
      hidden_state: this.hidden_state,
      hidden_timezone: this.hidden_timezone,
      street: form.value.street,
      city: form.value.city,
      state: form.value.state};

    this.inputService.getDaily(this.get_data).subscribe(output => {
      /* Need to make sure to write a method inside daily Component that can handle
      different error message json keys from different APIs */
      this.dailyResponseJson = output;
      // Pass the json data 
      this.inputdailyService.getJson(this.dailyResponseJson);
      // Send the form data
      this.inputdailyService.getInput(this.get_data);
      // If we simply redirect back to daily, all the previous states are preserved
      // because we don't update any new information. This is why we simply need to
      // call ngOnInit() again to reinitialize all the data
      this.ngOnInit();
    })
  } // dailyResponse

  getCity(curInput) {
    // You have to masure sure to declare auto_city is empty at the function call
    // or it just compiles all results for every key stroke
    this.auto_city = [];
    let curInputU = curInput.toUpperCase();
    this.auto_data = {curInput: curInputU};
    this.inputService.getCity(this.auto_data).subscribe(output => {
      this.auto_response = output;
      if (this.auto_response["error_message"]) {
        // If error message is displayed, show error message
        this.auto_city = [];
      } else if (this.auto_response["predictions"].length === 0) {
        // When autocomplete request is empty
        this.auto_city = [];
      } else {
        // else extract the predictions
        this.auto_city = [];
        let auto_response_length = this.auto_response["predictions"].length;
        // If the description returns less than 5, use that length of description
        let min_length = Math.min(auto_response_length, this.auto_length);
        for (let i = 0; i < min_length; i++) {
          // description field returns city, state, country. Only extract city
          let city_extracted = this.auto_response["predictions"][i]["description"].split(',')[0];
          this.auto_city.push(city_extracted);
        }
      }
    })
  } // getCity

  addFavorite() {
    if (this.isFavorite) {
      return;
    } else {
      var storedCity = JSON.parse(localStorage.getItem("cities"));
      var storedState = JSON.parse(localStorage.getItem("states"));
      var storedImage = JSON.parse(localStorage.getItem("images"));
      // curCity is a property that was parsed inside ngOnInit
      storedCity.push(this.curCity); 
      storedState.push(this.curState);
      storedImage.push(this.inputImage);
      // Store back to local storage
      localStorage.setItem("cities", JSON.stringify(storedCity));
      localStorage.setItem("states", JSON.stringify(storedState));
      localStorage.setItem("images", JSON.stringify(storedImage));  

      // This is to ensure that favorite button gets colored when clicked
      this.isFavorite = true;
    }
  }

  checkFavorite(curCity) {
    // This function ensures that we are not saving any duplicate cities
    // inside favorite section. Use the local variable city inside ngOnInit()
    // and localStorage 
    var storedCity = JSON.parse(localStorage.getItem("cities"));
    this.isFavorite = storedCity.includes(curCity);
  }

  clearPage() {
    this.router.navigate([""]);
  }

  backToDetail() {
    // Send the form data
    this.router.navigate(["daily"]);
  }

  toFavorite() {
    // Send the form data
    this.router.navigate(["favorite"]);
  }
}