import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YearAndGenderFormComponent } from './year-and-gender-form.component';

describe('YearAndGenderFormComponent', () => {
  let component: YearAndGenderFormComponent;
  let fixture: ComponentFixture<YearAndGenderFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YearAndGenderFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YearAndGenderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
