import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';

import { Person } from '../model/models';
import { NameService } from '../name.service';
import { YearAndGenderFormComponent } from '../shared/year-and-gender-form/year-and-gender-form.component';

@Component({
  selector: 'app-name-list',
  templateUrl: './name-list.component.html',
  styleUrls: ['./name-list.component.css']
})
export class NameListComponent implements OnInit {

  isLoading = true;
  dataSource = new MatTableDataSource<Person>();
  displayedColumns = ['rank', 'name', 'gender', 'occurrences'];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(YearAndGenderFormComponent, {static: true}) query: YearAndGenderFormComponent;

  constructor(
    private nameService: NameService
  ) {
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;

    this.fetch();
  }

  fetch() {
    this.isLoading = true;
    this.nameService.fetchAll(this.query.value())
      .subscribe(data => {
        this.isLoading = false;
        this.dataSource.data = data;
      });
  }

  onQuery() {
    this.fetch();
  }
}
