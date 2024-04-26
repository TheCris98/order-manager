import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Response } from 'src/app/models/navigation';

@Injectable({
  providedIn: 'root'
})
export class TimeZoneService {

  constructor(private http: HttpClient) { }
  async getTimeByZone(zone: string): Promise<Response> {
    const url = `http://worldtimeapi.org/api/timezone/${zone}`;
    try {
      const response = await this.http.get(url).toPromise() as any;
      const date = new Date(response.datetime);
      return { data: date, message: 'Ok' };
    } catch (error) {
      const timestamp = new Date();
      return { data: timestamp, message: 'Error' };
    }
  }

}
