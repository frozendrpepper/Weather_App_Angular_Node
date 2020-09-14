import { Component, OnInit } from '@angular/core';
import { InputService } from '../../services/input.service';
import { InputdailyService } from '../../services/inputdaily.service';
import { InputformService } from '../../services/inputform.service';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { VirtualTimeScheduler } from 'rxjs';

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.css']
})
export class InputComponent implements OnInit {
  // Two way binding varaibles for hidden inputs
  hidden_lattitude: string = 'N/A';
  hidden_longitude: string = 'N/A';
  hidden_city: string = 'N/A';
  hidden_state: string = 'N/A';
  hidden_timezone: string = 'N/A';
  // Variables for storing api data
  get_data: any;
  auto_data: any;
  auto_length: number = 5;
  // Daily resposne
  dailyResponseJson: any = [];
  auto_response: any = [];
  // Store autocomplete city
  auto_city: any = [];
  // Custom image data
  error_message: string = "";
  showProgress: boolean;
  // This will be global variable to see if localstorage has been instantiated
  localInitiated: boolean;

  inputData: any;
  // Variables used for input
  inputStreet: any;
  inputCity: any;
  inputState: any;
  inputCheck: any;

  favCheck: boolean;

  constructor(private inputService: InputService, private inputdailyService: InputdailyService,
              private router: Router, private inputformService: InputformService) { }

  ngOnInit() {
    // Initialize the localstorage
    if (localStorage.getItem("instantiated") !== "true") {
      this.initializeLocal();
    }

    this.showProgress = false;
    // Get IpApi input
    this.inputService.getIpApi().subscribe(ipOutput => {
      this.hidden_lattitude = ipOutput["lat"];
      this.hidden_longitude = ipOutput["lon"];
      this.hidden_city = ipOutput["city"];
      this.hidden_state = ipOutput["region"];
      this.hidden_timezone = ipOutput["timezone"];
    })
  }

  dailyResponse(form: NgForm) {
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
    
    // Get the daily data from Dark Sky here
    this.inputService.getDaily(this.get_data).subscribe(output => {
      /* Need to make sure to write a method inside daily Component that can handle
      different error message json keys from different APIs */
      this.dailyResponseJson = output;
      // Pass the json data 
      this.inputdailyService.getJson(this.dailyResponseJson);
      // Send the form data
      this.inputdailyService.getInput(this.get_data);
      this.router.navigate(["daily"])
    })
  }

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
  }

  initializeLocal() {
    // Initialize the local storage with empty arrays that saves information
    // on city, states and images. Remember that localStorage can only handle
    // strings which is why we need to JSON.stringify to save and use JSON.parse
    // when we actually fetch the data
    var placeholder = []
    localStorage.setItem("instantiated", "true");
    localStorage.setItem("cities", JSON.stringify(placeholder));
    localStorage.setItem("states", JSON.stringify(placeholder));
    localStorage.setItem("images", JSON.stringify(placeholder));
  }

  clearPage(myForm: NgForm) {
    this.inputStreet = "";
    this.inputCity = "";
    this.inputState = "";
    this.inputCheck = false;
    // This line is to ensure the inputs are set as untouched
    myForm.form.markAsPristine();
    myForm.form.markAsUntouched();
  }

  toFavorite() {
    this.router.navigate(["inputfavorite"]);
  }

  backToDetail() {
    this.router.navigate([""]);
  }
}
