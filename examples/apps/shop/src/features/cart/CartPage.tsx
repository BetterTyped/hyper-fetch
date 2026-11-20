import { Link } from "react-router";

import { Price } from "../../components/Price";
import { useCart } from "./use-cart";

export const CartPage = () => {
  const { cart, error, loading, saving, saveError, add, remove } = useCart();

  if (loading && !cart) return <p aria-busy="true">Loading your cart...</p>;
  if (error) return <p className="error">Could not load your cart: {error.message}</p>;
  if (!cart || cart.products.length === 0) {
    return (
      <article>
        <p>Your cart is empty.</p>
        <Link to="/">Browse the catalog</Link>
      </article>
    );
  }

  // Shown right away from the lines. The total with discounts comes from the server after each save.
  const subtotal = cart.products.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <article>
      <h1>Your cart</h1>
      {saveError && <p className="error">The last change could not be saved and was undone: {saveError.message}</p>}
      <table>
        <tbody>
          {cart.products.map((line) => (
            <tr key={line.id}>
              <td>
                <img src={line.thumbnail} alt="" width={48} />
              </td>
              <td>
                <Link to={`/products/${line.id}`}>{line.title}</Link>
              </td>
              <td>
                <div role="group" className="quantity">
                  <button type="button" className="outline secondary" onClick={() => remove(line)}>
                    -
                  </button>
                  <span>{line.quantity}</span>
                  <button type="button" className="outline secondary" onClick={() => add(line)}>
                    +
                  </button>
                </div>
              </td>
              <td>
                <Price value={line.price * line.quantity} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="cart-footer">
        <div>
          Subtotal <Price value={subtotal} />
          <br />
          <strong aria-busy={saving}>
            {saving ? (
              "Updating prices..."
            ) : (
              <>
                Total with discounts <Price value={cart.discountedTotal} />
              </>
            )}
          </strong>
        </div>
        <Link to="/checkout" role="button">
          Checkout
        </Link>
      </footer>
    </article>
  );
};
