import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'new-update',
  templateUrl: './new-update.component.html',
  styleUrls: ['./new-update.component.scss']
})
export class NewUpdateComponent {

  constructor(
    public dialogRef: MatDialogRef<NewUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any ) {}

}
