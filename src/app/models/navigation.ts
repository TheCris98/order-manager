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