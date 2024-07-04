import React, { useEffect, useState } from "react";
import Layout from "../componets/Layout/Layout";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { enqueueSnackbar } from "notistack";
// import
const CartPage = () => {
  const [auth, setAuth] = useAuth();
  const [cart, setCart] = useCart();
  const [handerResponse, setHanderResponse] = useState({});

  const updateCartSaveInfoInDB = async () => {
    console.log(handerResponse);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_START}/api/v1/product/paymentVerification`,
        { ...handerResponse, cart }
      );
      if (data?.success) {
        enqueueSnackbar(data.message, { variant: "success" });
        setCart([]);
        localStorage.setItem("cart", "");
      }
    } catch (error) {
      console.log(error);
      enqueueSnackbar(error.message, { variant: "error" });
    }
  };

  useEffect(() => {
    if (handerResponse?.razorpay_signature) updateCartSaveInfoInDB();
  }, [handerResponse]);

  const navigate = useNavigate();

  const removeCartItem = (pid) => {
    try {
      let prevCart = [...cart];
      prevCart = prevCart.filter((item) => item._id != pid);
      localStorage.setItem("cart", JSON.stringify(prevCart));
      setCart(prevCart);
    } catch (error) {
      console.error(error);
    }
  };

  const totalPrice = () => {
    try {
      let tprice = 0;
      if (cart) {
        // tprice = cart?.reduce((accumulator, currentValue) => {
        //   return accumulator + currentValue.price;
        // }, 0);
        tprice = cart?.reduce((total, currentItem) => {
          return total + currentItem.price * currentItem.quantity;
        }, 0);
      }
      return tprice;
    } catch (error) {
      console.error(error);
    }
  };

  const handlePayWithRazor = async () => {
    try {
      if (!auth.user) {
        enqueueSnackbar("Login for checkout", { variant: "warning" });
        return;
      }
      if (cart.length < 1) {
        enqueueSnackbar("Add some Products ", { variant: "warning" });
        return;
      }
      const {
        data: { order },
      } = await axios.post(
        `${import.meta.env.VITE_START}/api/v1/product/order`,
        {
          amount: totalPrice() * 100,
        }
      );

      if (order) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          name: "Wall Colors",
          description: "Ecommerce App Integration with RazorPay",
          image:
            "http://res.cloudinary.com/dcwr0gis2/image/upload/updrteoysouqhrstcxoi.jpg",
          order_id: order.id,
          handler: async (response) => {
            setHanderResponse({ ...response });
          },
          prefill: {
            name: auth.user.name,
            email: auth.user.email,
            contact: auth.user.phone,
          },
          notes: {
            address: auth.user.address,
          },
          theme: {
            color: "#111111",
          },
        };
        const razor = new window.Razorpay(options);
        razor.on("payment.failed", function (response) {
          // alert(response.error.code);
          // alert(response.error.description);
          // alert(response.error.source);
          // alert(response.error.step);
          // alert(response.error.reason);
          // alert(response.error.metadata.order_id);
          // alert(response.error.metadata.payment_id);
          enqueueSnackbar(response.error, { variant: "error" });
        });
        razor.open();
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout title={"Cart"}>
      <div className="text-center m-2">{`Hello ${
        auth?.token && auth?.user.name
      }`}</div>
      <div className="text-center">
        {cart?.length > 0
          ? `You Have ${cart.length} Products In Your Cart ${
              !auth?.token ? "Please Login To Checkout" : ""
            }`
          : "Your Cart is Empty"}
      </div>

      <div className="sm:flex ">
        {cart?.length > 0 && (
          <div className="m-4 flex-1">
            {cart.map((item, index) => {
              return (
                <div key={index} className="flex border relative p-2">
                  <img
                    src={`http://res.cloudinary.com/dcwr0gis2/image/upload/ecommerce-app/product-image/${item?.slug}.jpg`}
                    className="w-20 aspect-square rounded object-cover"
                    alt={item.slug}
                  />
                  <div>
                    <h3 className="text-xl px-2 text-[#4d4d4d] truncate">
                      {item.name}
                    </h3>
                    <h4 className="text-sm p-2 font-light text-[#4d4d4d]">
                      Price : Rs.{item.price}
                    </h4>
                    <h4 className="px-2">Quantity : {item?.quantity}</h4>
                    <button
                      onClick={() => {
                        console.log("Remove Cart Button is Clicked");
                        removeCartItem(item._id);
                      }}
                      className="rounded-full border p-1 text-white bg-red-500 absolute right-[5px] bottom-[7px]"
                    >
                      <RxCross2 />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="m-4 flex-1 text-center">
          <h5 className="text-xl font-semibold mb-4 text-[#4d4d4d]">
            {auth?.user ? `Your Address :` : "Please Login "}
          </h5>
          <h5 className="mb-4">{auth?.user ? `${auth.user.address}` : ""}</h5>
          {auth?.user ? (
            <button
              onClick={() => navigate("/dashboard/user/profile")}
              className="p-2  border mt-2 bg-[#4d4d4d] text-white rounded"
            >
              Update Address
            </button>
          ) : (
            <button
              onClick={() => navigate("/login", { state: "/cart" })}
              className="p-2  border mt-2 bg-yellow-200 rounded"
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div className="w-full bg-white">
        <div className="flex fixed bottom-0 left-0 w-full p-4 border justify-around bg-white">
          <div className="p-2 border rounded">
            Total Price : Rs.{totalPrice()}
          </div>
          <button
            onClick={handlePayWithRazor}
            className="p-2 px-10 border bg-[#4d4d4d] text-white rounded"
          >
            Checkout
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;
