import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-companyhome',
  standalone: true,
  templateUrl: './companyhome.component.html',
  styleUrls: ['./companyhome.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class CompanyhomeComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
