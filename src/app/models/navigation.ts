export interface UserData {
    uid: string;
    email: string;
    name: string;
    lastname: string;
    address: string;
    phone: string;
    role: string;
    avatar: string;
    creationDate: Date;
}

export interface FirebaseError {
    message: string;
    color: string;
    icon: string;
}

export interface Response {
    data: any;
    message: string;
}

export interface Categorie {
    uid: string;
    name: string;
    image: string;
}

export interface Product {
    uid: string;
    name: string;
    description: string;
    price: number;
    image: string;
    categorie: string;
    state: string;
    stock: number;
}

export interface OrderDetail {
    uid: string;
    product: Product;
    quantity: number;
    indication: string;
    requestedDate: Date;
    state: string;
}

export interface Table {
    uid: string;
    capacity: number;
    number: number;
    status: string;
}

export interface Order {
    uid: string;
    details: OrderDetail[];
    table: Table;
    totalAmount: number;
    orderDate: Date;
    orderedBy: UserData; 
}

export interface DeviceToken {
    uid: string; // Unique ID of the document
    userId: string; // ID of the user
    token: string; // FCM Token
    platform: string; // 'android', 'ios', 'web'
    lastUsed: Date; // Timestamp of the last use
  }
  
