
import {Gender} from './gender.enum';

export interface Person {
  name: string;
  gender: Gender;
  occurrences: number;
}

export interface PersonVO {
  person: Person;
  selected: boolean;
}

export interface YearAndGender {
  year: number;
  gender: Gender;
}

export interface SpeechConfig {
  enabled: boolean;
  lang: string;
  name: string;
}
