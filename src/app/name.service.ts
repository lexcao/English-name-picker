import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Person, YearAndGender } from './model/models';
import { catchError } from 'rxjs/operators';
import { Gender } from './model/gender.enum';

@Injectable({
  providedIn: 'root'
})
export class NameService {

  private url = 'https://raw.githubusercontent.com/lexcao/English-name-dataset/master/json/';

  constructor(private http: HttpClient) {
  }

  fetchAll(query: YearAndGender): Observable<Person[]> {
    const {year = 2018, gender = Gender.male} = query;
    return this.http.get<Person[]>(`${this.url}/${year}-${gender}.json`)
      .pipe(
        catchError(err => {
          console.error(err);
          return of([]);
        })
      );
  }
}


