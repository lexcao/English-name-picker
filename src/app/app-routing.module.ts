import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NameListComponent } from './name-list/name-list.component';
import { NamePickerComponent } from './name-picker/name-picker.component';

const routes: Routes = [
  {path: '', component: NamePickerComponent},
  {path: 'pick', component: NameListComponent},
  {path: 'names', component: NameListComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
