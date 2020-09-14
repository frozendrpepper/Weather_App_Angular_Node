import { Component, OnInit, ElementRef } from '@angular/core';
import { InputService } from '../../services/input.service';
import { InputdailyService } from '../../services/inputdaily.service';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart } from 'chart.js';
import { VirtualTimeScheduler } from 'rxjs';

@Component({
  selector: 'app-favorite',
  templateUrl: './favorite.component.html',
  styleUrls: ['./favorite.component.css']
})
export class FavoriteComponent implements OnInit {
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

  // Variables to store localStorage data
  favCities = [];
  favStates = [];
  favImages = [];
  favData = [];

  // Variable for ngIf condition 
  isEmpty: boolean;
  inputData: any;
  // Variables used for input
  inputStreet: any;
  inputCity: any;
  inputState: any;
  inputCheck: any;

  constructor(private inputService: InputService, private inputdailyService: InputdailyService,
              private router: Router) { }

  ngOnInit() {
    this.inputService.getIpApi().subscribe(ipOutput => {
      this.hidden_lattitude = ipOutput["lat"];
      this.hidden_longitude = ipOutput["lon"];
      this.hidden_city = ipOutput["city"];
      this.hidden_state = ipOutput["region"];
      this.hidden_timezone = ipOutput["timezone"];
    })
    // Receive Form input data
    this.inputData = this.inputdailyService.exportInput();
    console.log("input form data: ", this.inputData);
    this.preserveInput(this.inputData);
    // Make sure once again to clear arrays in case ngOnInit is 
    // reinstantiated
    this.favData = [];
    this.favCities = [];
    this.favStates = [];
    this.favImages = [];
    // Get data from localStorage and parse them
    var storedCity = JSON.parse(localStorage.getItem("cities"));
    var storedState = JSON.parse(localStorage.getItem("states"));
    var storedImage = JSON.parse(localStorage.getItem("images"));
    // Parse data such that it's in format [{key1: val1, key2, val2}]
    // such that we can more easily loop through using *ngFor
    this.favCities = storedCity;
    this.favStates = storedState;
    this.favImages = storedImage;
    // If favCities, States and Images are emtpy, should display no result
    if (this.favCities.length === 0 && this.favStates.length === 0 && this.favImages.length ===0){
      this.isEmpty = true;
    } else {
      this.isEmpty = false;
      for (let i = 0; i < this.favCities.length; i++) {
        var tmp_dict = {}
        tmp_dict["cityIndex"] = this.favCities[i];
        tmp_dict["stateIndex"] = this.favStates[i];
        tmp_dict["imageIndex"] = this.favImages[i];
        this.favData.push(tmp_dict);
      }
    }
  }

  preserveInput(inputJson) {
    if (inputJson.street === undefined) {
      this.inputStreet = "";
      this.inputCity = "";
      this.inputState = "";
      this.inputCheck = true;
    } else {
      this.inputStreet = inputJson.street;
      this.inputCity = inputJson.city;
      this.inputState = inputJson.state;
      this.inputCheck = false;
    }
  }

  // Methods adds functionality to delete element from favorite
  deleteFavorite(curId) {
    var curIdNum = parseInt(curId);
    var storedCity = JSON.parse(localStorage.getItem("cities"));
    var storedState = JSON.parse(localStorage.getItem("states"));
    var storedImage = JSON.parse(localStorage.getItem("images"));

    // Delete element corresponding to the index that button passed
    storedCity.splice(curIdNum, 1);
    storedState.splice(curIdNum, 1);
    storedImage.splice(curIdNum, 1);
    // First have to delete remove all info and rebuild localstorage
    localStorage.removeItem("cities");
    localStorage.removeItem("states");
    localStorage.removeItem("images");

    localStorage.setItem("cities", JSON.stringify(storedCity));
    localStorage.setItem("states", JSON.stringify(storedState));
    localStorage.setItem("images", JSON.stringify(storedImage));

    // Reinstantiate to reflect the change
    this.ngOnInit();
  }

  // These are same methods from InputComponent
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
      this.router.navigate(["daily"]);
    })
  } // dailyResponse

  // Just using city and state response, we fetch new daily information
  favDailyResponse(curClass) {
    var curCity = curClass.split(',')[0];
    var curState = curClass.split(',')[1];
    this.showProgress = true;
    this.get_data = 
      {hidden_lattitude: this.hidden_lattitude, 
      hidden_longitude: this.hidden_longitude,
      hidden_city: this.hidden_city,
      hidden_state: this.hidden_state,
      hidden_timezone: this.hidden_timezone,
      street: "undefined",
      city: curCity,
      state: curState};

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
      this.router.navigate(["daily"]);
    })
  } // favDailyResponse

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

  clearPage() {
    this.router.navigate([""]);
  }

  backToDetail() {
    this.router.navigate(["daily"]);
  }

  toFavorite() {
    this.router.navigate(["favorite"]);
  }
}