import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NameListComponent } from './name-list.component';

describe('NameListComponent', () => {
  let component: NameListComponent;
  let fixture: ComponentFixture<NameListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NameListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NameListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
