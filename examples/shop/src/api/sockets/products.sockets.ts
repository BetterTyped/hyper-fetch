import { socket } from "../clients";
import { ProductType } from "../firebase/products.api";

export const productsListener = socket.createListener<ProductType[]>()({ topic: "/products" });

export const productListener = socket.createListener<ProductType>()({ topic: "/products/:productId" });
