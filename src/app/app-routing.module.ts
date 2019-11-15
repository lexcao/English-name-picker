import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NameListComponent } from './name-list/name-list.component';
import { NamePickerComponent } from './name-picker/name-picker.component';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  {path: 'choose', component: NamePickerComponent},
  {path: 'browser', component: NameListComponent},
  {path: 'check', component: NameListComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
