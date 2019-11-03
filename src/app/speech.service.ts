import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SpeechConfig } from './model/models';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {

  speaker = window.speechSynthesis;
  speech = new SpeechSynthesisUtterance();
  availableVoices$ = new Subject<SpeechSynthesisVoice[]>();
  availableVoices = [];

  private configSubject: Subject<SpeechConfig>;
  // tslint:disable-next-line:variable-name
  private readonly _config = {
    enabled: false,
    lang: 'en-US',
    name: 'Alex',
  };

  constructor() {
    this.speaker.addEventListener('voiceschanged', () => {
        this.availableVoices = this.speaker.getVoices();
        this.availableVoices$.next(this.availableVoices);
      }
    );
    this.configSubject = new Subject<SpeechConfig>();
    this.setConfig(this._config);
  }

  say(text: string) {
    if (!this._config.enabled) {
      return;
    }
    this.speech.text = text;
    this.speaker.speak(this.speech);
  }

  config(): Observable<SpeechConfig> {
    return this.configSubject.asObservable();
  }

  setConfig(config: { enabled?: boolean, lang?: string, name?: string }) {
    Object.assign(this._config, config);
    this.configSubject.next(this._config);
    this.updateVoice();
  }

  updateVoice() {
    const {lang, name} = this._config;
    const find = this.availableVoices.find(it => it.lang === lang && it.name === name);
    if (find) {
      this.speech.voice = find;
    }
  }
}
