import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OrdersPageRoutingModule } from './orders-routing.module';

import { OrdersPage } from './orders.page';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { ModalWrapperComponent } from 'src/app/components/modal-wrapper/modal-wrapper.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersPageRoutingModule
  ],
  declarations: [OrdersPage, OrderDetailsComponent, ModalWrapperComponent]
})
export class OrdersPageModule { }
