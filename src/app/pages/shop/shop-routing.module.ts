import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShopPage } from './shop.page';

const routes: Routes = [
  {
    path: '',
    component: ShopPage
  },
  {
    path: 'products/:id',
    loadChildren: () => import('./products/products.module').then( m => m.ProductsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopPageRoutingModule {}
