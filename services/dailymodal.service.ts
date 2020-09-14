import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DailymodalService {
  modal_data: any;
  city: string;
  modalUrl: string = "http://Csci571Hw8-env.xtrxtwd7xj.us-west-1.elasticbeanstalk.com/modal";

  constructor(private http: HttpClient) { }

  extractCity(city) {
    this.city = city;
  }

  returnCity() {
    return this.city;
  }

  extractModalData(modalData) {
    this.modal_data = modalData;
  }

  returnModalData() {
    return this.modal_data;
  }

  getDaily(get_data) {
    return this.http.get(this.modalUrl, {params: get_data}).pipe(map(dailyresponse => {
      return dailyresponse;
    }))
  }
}
