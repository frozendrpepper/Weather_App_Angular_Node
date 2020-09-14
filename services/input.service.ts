import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InputService {
  /*This service is used to grab initial data from input component */
  dailyUrl: string = "http://Csci571Hw8-env.xtrxtwd7xj.us-west-1.elasticbeanstalk.com/daily";
  ipUrl: string = "http://ip-api.com/json";
  autoUrl: string = "http://Csci571Hw8-env.xtrxtwd7xj.us-west-1.elasticbeanstalk.com/auto";
  customUrl: string = "http://Csci571Hw8-env.xtrxtwd7xj.us-west-1.elasticbeanstalk.com/custom";

  constructor(private http: HttpClient) { }

  getCity(curInput) {
    return this.http.get(this.autoUrl, {params: curInput}).pipe(map(autoResponse => {
      return autoResponse;
    }))
  }

  getIpApi() {
    return this.http.get(this.ipUrl).pipe(map(ipResponse => {
      return ipResponse;
    }))
  }

  getDaily(get_data) {
    return this.http.get(this.dailyUrl, {params: get_data}).pipe(map(dailyresponse => {
      return dailyresponse;
    }))
  }
}
