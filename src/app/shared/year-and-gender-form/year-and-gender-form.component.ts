import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { YearAndGender } from '../../model/models';

@Component({
  selector: 'app-year-and-gender-form',
  templateUrl: './year-and-gender-form.component.html',
  styleUrls: ['./year-and-gender-form.component.css']
})
export class YearAndGenderFormComponent implements OnInit {

  readonly form: FormGroup;
  filteredYears: Observable<string[]>;
  permitYears = [];
  hint;

  constructor(formBuilder: FormBuilder) {
    for (let i = 1880; i <= 2018; i++) {
      this.permitYears.push(i + '');
    }

    const min = this.permitYears[0];
    const max = this.permitYears[this.permitYears.length - 1];
    this.form = formBuilder.group({
      year: [2018, [Validators.required,
        Validators.min(min),
        Validators.max(max)
      ]],
      gender: 'male'
    });

    this.hint = min + '~' + max;
  }

  ngOnInit() {
    this.filteredYears = this.form.controls.year.valueChanges.pipe(
      startWith('2018'),
      map(value => this.onFilter(value ? value.toString() : '0'))
    );
  }

  invalid() {
    return this.form.invalid;
  }

  value(): YearAndGender {
    return this.form.value;
  }

  group(): FormGroup {
    return this.form;
  }

  private onFilter(year: string): string[] {
    return this.permitYears.filter(value =>
      value.indexOf(year) === 0
    );
  }
}
