import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FolderPage } from './folder.page';

const routes: Routes = [
  {
    path: 'folder',
    component: FolderPage,
    children: [
      { path: 'profile', loadChildren: () => import('src/app/pages/profile/profile.module').then(m => m.ProfilePageModule) },
      { path: 'orders', loadChildren: () => import('src/app/pages/orders/orders.module').then(m => m.OrdersPageModule) },
      { path: 'shop', loadChildren: () => import('src/app/pages/shop/shop.module').then(m => m.ShopPageModule) },
      { path: '', redirectTo: 'profile', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    redirectTo: '/folder/profile',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FolderPageRoutingModule { }
