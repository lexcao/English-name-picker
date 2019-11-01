import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {NameService} from '../name.service';
import {Person, PersonVO} from '../model/models';
import {SpeechService} from '../speech.service';

@Component({
  selector: 'app-name-picker',
  templateUrl: './name-picker.component.html',
  styleUrls: ['./name-picker.component.css'],
})
export class NamePickerComponent implements OnInit {

  extend: FormGroup;

  persons: PersonVO[] = [];
  selected: { [name: string]: Person } = {};
  letters: string[];
  limit = 100;
  offset = 0;
  private result: Person[];
  private filtered: Person[];

  constructor(
    formBuilder: FormBuilder,
    private nameService: NameService,
    private speechService: SpeechService) {
    this.extend = formBuilder.group({
      startWith: 'C'
    });
    this.letters = Array.from(
      {length: 26},
      (_, i) => String.fromCharCode('A'.charCodeAt(0) + i)
    );
  }

  ngOnInit() {
  }

  fetchResult(query) {
    this.nameService.fetchAll(query).subscribe(data => {
      this.result = data;
    });
  }

  filterResult() {
    this.reset();
    const {startWith} = this.extend.value;

    this.filtered = this.result.filter(person => {
      return person.name.startsWith(startWith);
    });

    this.loadMore();
  }

  loadMore() {
    const offset = this.offset;
    this.persons = this.filtered.slice(offset, offset + this.limit)
      .map(data => {
        return {
          person: data,
          selected: false
        };
      });
    this.offset += this.limit;
  }

  canLoad(): boolean {
    return this.offset > this.filtered.length;
  }

  onSelect(index: number) {
    const {person, selected} = this.persons[index];
    this.persons[index] = {
      person,
      selected: !selected
    };

    const name = person.name;
    if (selected) {
      this.removeSelected(name);
    } else {
      this.selected[name] = person;
      this.speech(name);
    }
  }

  selectedPerson(): Person[] {
    return Object.values(this.selected);
  }

  removeSelected(name: string) {
    delete this.selected[name];
  }

  speech(text: string) {
    this.speechService.say(text);
  }

  private reset() {
    this.offset = 0;
    this.persons = [];
    this.selected = {};
    this.filtered = [];
  }

  private colorByGender(gender: string) {
    if (gender === 'M') {
      return 'primary';
    } else {
      return 'accent';
    }
  }
}
