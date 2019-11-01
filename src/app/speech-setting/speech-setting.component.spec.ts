import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpeechSettingComponent } from './speech-setting.component';

describe('SpeechSettingComponent', () => {
  let component: SpeechSettingComponent;
  let fixture: ComponentFixture<SpeechSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpeechSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpeechSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
