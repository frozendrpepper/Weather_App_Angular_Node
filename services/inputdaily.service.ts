import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputdailyService {
  /*This service is used to pass information from input component
  to daily component */

  // This variable stores the json that is being passed from 
  // InputComponent to DailyComponent
  inputToDailyJson: any;
  inputToDailyImage: any;
  inputSave: any;

  constructor() { }

  getJson(jsonData) {
    /* This simply grabs json InputComponent which is returned by DarkSky API */
    this.inputToDailyJson = jsonData;
  }

  exportJson() {
    return this.inputToDailyJson;
  }

  getInput(inputData) {
    this.inputSave = inputData;
  }

  exportInput() {
    return this.inputSave;
  }
}
