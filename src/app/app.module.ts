import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {NameListComponent} from './name-list/name-list.component';
import {
  MatAutocompleteModule,
  MatBadgeModule,
  MatButtonModule,
  MatButtonToggleModule,
  MatCardModule,
  MatChipsModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatProgressSpinnerModule,
  MatRadioModule, MatSelectModule, MatSlideToggleModule,
  MatStepperModule,
  MatToolbarModule
} from '@angular/material';
import {ReactiveFormsModule} from '@angular/forms';
import {NamePickerComponent} from './name-picker/name-picker.component';
import {YearAndGenderFormComponent} from './shared/year-and-gender-form/year-and-gender-form.component';
import { SpeechSettingComponent } from './speech-setting/speech-setting.component';


@NgModule({
  declarations: [
    AppComponent,
    NameListComponent,
    NamePickerComponent,
    YearAndGenderFormComponent,
    SpeechSettingComponent
  ],
  imports: [
    BrowserModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatInputModule,
    MatRadioModule,
    MatTableModule,
    MatButtonModule,
    AppRoutingModule,
    HttpClientModule,
    MatStepperModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSelectModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
