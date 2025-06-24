import Confetti from "react-confetti";

import { useCheckout } from "hooks/use-checkout";

export const CheckoutComplete = () => {
  const { checkout, setCheckout } = useCheckout();

  return (
    <Confetti
      style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 9999 }}
      numberOfPieces={checkout ? 2500 : 0}
      recycle={false}
      onConfettiComplete={(confetti) => {
        setCheckout(false);
        confetti?.reset();
      }}
    />
  );
};
