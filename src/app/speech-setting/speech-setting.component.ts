import {Component, OnInit} from '@angular/core';
import {SpeechService} from '../speech.service';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-speech-setting',
  templateUrl: './speech-setting.component.html',
  styleUrls: ['./speech-setting.component.css'],

})
export class SpeechSettingComponent implements OnInit {

  availableVoices = [];
  availableNames = [];
  voiceControl: FormGroup;

  constructor(
    formBuilder: FormBuilder,
    private speechService: SpeechService) {

    this.voiceControl = formBuilder.group({
      lang: '',
      enabled: false,
      name: '',
    });
  }

  ngOnInit() {
    this.speechService.availableVoices$.subscribe(
      it => {
        this.availableVoices = it;
        this.onSelect();
      }
    );

    this.speechService.config().subscribe(config => {
      const {lang, enabled, name} = config;
      this.voiceControl.setValue({
        lang,
        enabled,
        name
      });
    });
  }

  onToggle(enabled: boolean) {
    this.speechService.setConfig({enabled});
  }

  onSelect(key: string = 'lang') {
    const config = {
      lang: '',
      name: '',
    };

    if (key === 'lang') {
      const {lang} = this.voiceControl.value;
      this.availableNames = this.availableVoices.filter(it => it.lang === lang);

      const name = this.availableNames[0].name;
      this.voiceControl.controls.name.setValue(name);

      config.lang = lang;
      config.name = name;
    }

    if (key === 'name') {
      delete config.lang;
      config.name = this.voiceControl.value.name;
    }

    this.speechService.setConfig(config);
  }
}
