import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InputformService {
  inputData: any;
  constructor() { }

  fetchData(data) {
    this.inputData = data;
  }

  exportData() {
    return this.inputData;
  }
}
