import { Component, Input, OnInit, ViewChild, ViewContainerRef, ComponentFactoryResolver, ComponentRef, Injector } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-modal-wrapper',
  templateUrl: './modal-wrapper.component.html',
  styleUrls: ['./modal-wrapper.component.scss'],
})
export class ModalWrapperComponent implements OnInit {
  @Input() component: any;
  @Input() componentProps: any;
  @Input() title: string = 'Detalles';  // Título por defecto

  @ViewChild('dynamicComponent', { read: ViewContainerRef, static: true }) dynamicComponent!: ViewContainerRef;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.loadComponent();
  }

  loadComponent() {
    this.dynamicComponent.clear();
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component);
    const componentRef: ComponentRef<any> = this.dynamicComponent.createComponent(componentFactory);
    Object.assign(componentRef.instance, this.componentProps);
    // Escucha el evento closeModal del componente dinámico
    if (componentRef.instance.closeModal) {
      componentRef.instance.closeModal.subscribe(() => {
        this.close();
      });
    }
  }

  close() {
    this.modalController.dismiss();
  }
}
