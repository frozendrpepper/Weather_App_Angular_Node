import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DailymodalService } from '../../services/dailymodal.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit {
  modal_data: any;
  cur_city: string;
  actual_time: string;
  current_temp: any;
  current_sum: any;
  current_icon: any;
  current_prec: any;
  current_prec_chance: any;
  current_wind: any;
  current_humid: any;
  current_vis: any;

  // Error message variables
  isError: boolean;
  errorMessage: string;

  constructor(public activeModal: NgbActiveModal, private dailymodalService: DailymodalService) { }

  ngOnInit() {
    this.cur_city = this.dailymodalService.returnCity();
    this.modal_data = this.dailymodalService.returnModalData();
    // mapping object for output of summary to icon
    var detail_icon_dict = {
      "clear-day": "https://cdn3.iconfinder.com/data/icons/weather-344/142/sun-512.png",
      "clear-night": "https://cdn3.iconfinder.com/data/icons/weather-344/142/sun-512.png",
      "rain": "https://cdn3.iconfinder.com/data/icons/weather-344/142/rain-512.png", 
      "snow": "https://cdn3.iconfinder.com/data/icons/weather-344/142/snow-512.png",
      "sleet": "https://cdn3.iconfinder.com/data/icons/weather-344/142/lightning-512.png",
      "wind": "https://cdn4.iconfinder.com/data/icons/the-weather-is-nice-today/64/weather_10-512.png",
      "fog": "https://cdn3.iconfinder.com/data/icons/weather-344/142/cloudy-512.png",
      "cloudy": "https://cdn3.iconfinder.com/data/icons/weather-344/142/cloud-512.png",
      "partly-cloudy-day": "https://cdn3.iconfinder.com/data/icons/weather-344/142/sunny-512.png",
      "partly-cloudy-night": "https://cdn3.iconfinder.com/data/icons/weather-344/142/sunny-512.png",
      '0': "https://icon-library.net/images/no-image-available-icon/no-image-available-icon-6.jpg"
    }

    var error_list = this.checkError(this.modal_data);
    this.isError = error_list[0];
    this.errorMessage = error_list[1];

    this.parseData(this.modal_data, detail_icon_dict);
  }

  checkError(inputJson) {
    var isError = false;
    var errorMessage = "No Error";
    if (inputJson['error']) {
      // DarkSky error
      isError = true;
      errorMessage = inputJson['error'];
    }
    var return_result = [];
    return_result.push(isError);
    return_result.push(errorMessage);
    return return_result
  }

  // Helper function for parsing json data to make the code more readable
  parseData(inputJson, icon_dict) {
    var dailyData = inputJson['daily']['data'][0];
    var unixTime = dailyData['time'];
    var timeZone = inputJson['timezone'];
    this.actual_time = this.convertTime(unixTime, timeZone);
    this.current_temp = Math.round(inputJson['currently']['temperature']);
    this.current_sum = inputJson['currently']['summary'];
    this.current_icon = icon_dict[inputJson['currently']['icon']];
    this.current_prec = Math.round(100 * inputJson['currently']['precipIntensity']) / 100;
    this.current_prec_chance = Math.round(100 * inputJson['currently']['precipProbability']);
    this.current_wind = Math.round(100 * parseInt(inputJson['currently']['windSpeed'], 10)) / 100;
    this.current_humid = Math.round(100 * inputJson['currently']['humidity']);
    this.current_vis = inputJson['currently']['visibility'];
  }

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

}
