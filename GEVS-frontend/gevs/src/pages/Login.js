import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import { Html5QrcodeScanner } from "html5-qrcode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import axios from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

function Login() {
  const [qrdata, setqrdata] = useState(false);
  const { user, login, logout } = useAuth();
  const formikRef = useRef();

  const handleqrcode = () => {
    setqrdata(true);
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 150,
        height: 150,
      },
      fps: 5,
    });

    scanner.render(sucess, error);
    function sucess(result) {
      scanner.clear();
      setqrdata(false);
      if (formikRef.current) {
        formikRef.current.setFieldValue("uvccode", result);
        console.log(result);
      }
    }
    function error(err) {
      console.warn(err);
    }

    function handleQrScanner() {
      scanner.clear();
    }
  };

  const initialValues = {
    email: "",
    password: "",
  };

  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string()
      .required("Password is required")
      .min(8, "Password must be at least 8 characters long")
      .matches(/^(?=.*\d)/, "Password must contain at least one numeric digit"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    axios
      .post("/login", values)
      .then(async (res) => {
        if (res) {
          toast.success("Logged in successfully", {
            position: "top-center",
            autoClose: 1500,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "colored",
          });
          login({ email: values.email });
          navigate("/UserDashboard");
        }
      })
      .catch((err) => {
        console.log(err);
        let outpt = err.response.data.message;
        toast.error(outpt, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      });
  };

  return (
    <div>
      {" "}
      <div className="loginOutter">
        <Navbar />
        <div className="footerManage">
          <div className="login">
            <h1 className="loginh1">Login</h1>
            <Formik
              innerRef={formikRef}
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="form">
                  <div>
                    <label htmlFor="email" className="label">
                      Email:
                    </label>
                    <Field
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                    />
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="error"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="label">
                      Password:
                    </label>
                    <Field
                      type="password"
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="error"
                    />
                  </div>
                  <div className="loginBtn">
                    <div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="signupButton"
                      >
                        {isSubmitting ? "logining..." : "Login"}
                      </button>
                    </div>

                    <div className="registAcc">
                      <Link className="link" to="../register">
                        Register an account
                      </Link>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
      <Footer />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={false}
        theme="colored"
      />
    </div>
  );
}

export default Login;
