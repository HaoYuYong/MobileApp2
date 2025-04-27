import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-employeehome',
  standalone: true,
  templateUrl: './employeehome.component.html',
  styleUrls: ['./employeehome.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class HomeComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
