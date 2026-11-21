import { useFetch } from "@hyper-fetch/react";
import { Link, useParams } from "react-router";

import { getProduct } from "../../api/products";
import { Price } from "../../components/Price";
import { useCart } from "../cart/use-cart";

export const ProductPage = () => {
  const productId = Number(useParams().productId);
  // Hovering the card in the catalog prefetched this, so it usually renders without a loading state.
  const {
    data: product,
    error,
    status,
    loading,
  } = useFetch(getProduct.setParams({ productId }), {
    revalidate: false,
  });
  const { cart, add } = useCart();
  const inCart = cart?.products.find((line) => line.id === productId)?.quantity ?? 0;

  if (loading && !product) return <article aria-busy="true">Loading product...</article>;
  if (error) {
    return (
      <article>
        <p className="error">{status === 404 ? "This product does not exist." : error.message}</p>
        <Link to="/">Back to the catalog</Link>
      </article>
    );
  }
  if (!product) return null;

  return (
    <article className="product">
      <img src={product.images[0] ?? product.thumbnail} alt="" />
      <div>
        <hgroup>
          <h1>{product.title}</h1>
          <p>
            {product.brand ?? "No brand"} · {product.category} · rated {product.rating}
          </p>
        </hgroup>
        <p>{product.description}</p>
        <h2>
          <Price value={product.price} />
        </h2>
        <button type="button" onClick={() => add(product)} disabled={product.stock === 0}>
          {product.stock === 0 ? "Out of stock" : "Add to cart"}
        </button>
        {inCart > 0 && (
          <p>
            <mark>{inCart} in your cart</mark> <Link to="/cart">View cart</Link>
          </p>
        )}
      </div>
    </article>
  );
};
